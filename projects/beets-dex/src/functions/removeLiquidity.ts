import { Address, parseUnits } from 'viem';
import { FunctionReturn, FunctionOptions, getChainFromName, toResult, checkToApprove, TransactionParams } from '@heyanon/sdk';
import {
    InputAmount,
    RemoveLiquidityInput,
    RemoveLiquidityKind,
    RemoveLiquidity,
    RemoveLiquidityBuildCallOutput,
    RemoveLiquidityBaseBuildCallInput,
    RemoveLiquidityBoostedV3,
    RemoveLiquidityBoostedProportionalInput,
    RemoveLiquidityBoostedBuildCallInput,
    RemoveLiquidityQueryOutput,
    RemoveLiquidityBoostedQueryOutput,
} from '@balancer/sdk';
import { DEFAULT_SLIPPAGE_AS_PERCENTAGE, supportedChains } from '../constants';
import { validatePercentage } from '../helpers/validation';
import { getBalancerTokenByAddress, getUnwrappedSymbol, to$$$, toHumanReadableAmount, toSignificant } from '../helpers/tokens';
import { Slippage } from '@balancer/sdk';
import { anonChainNameToBalancerChainId, anonChainNameToGqlChain, getDefaultRpcUrl } from '../helpers/chains';
import { BeetsClient } from '../helpers/beets/client';
import { GqlChain } from '../helpers/beets/types';
import { formatPoolType, fromGqlPoolMinimalToBalancerPoolStateWithUnderlyings, isBoostedPool } from '../helpers/pools';

interface Props {
    chainName: string;
    account: Address;
    poolId: string;
    removalPercentage: `${number}` | null;
    slippageAsPercentage: `${number}` | null;
}

export async function removeLiquidity({ chainName, account, poolId, removalPercentage, slippageAsPercentage }: Props, options: FunctionOptions): Promise<FunctionReturn> {
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Beets protocol is not supported on ${chainName}`, true);

    // Parse and validate removal percentage
    removalPercentage = removalPercentage ?? `${100}`;
    if (!validatePercentage(removalPercentage)) return toResult(`Invalid removal percentage: ${removalPercentage}`, true);
    const removalPercentageAsDecimal = Number(removalPercentage) / 100;

    // Parse and validate slippage
    slippageAsPercentage = slippageAsPercentage ?? `${DEFAULT_SLIPPAGE_AS_PERCENTAGE}`;
    if (!validatePercentage(slippageAsPercentage)) return toResult(`Invalid slippage: ${slippageAsPercentage}`, true);
    const slippage = Slippage.fromPercentage(slippageAsPercentage);

    // Get balancer chain ID
    const balancerChainId = anonChainNameToBalancerChainId(chainName);
    if (!balancerChainId) return toResult(`Chain ${chainName} not supported by SDK`, true);

    // Get pool from Balancer API
    await options.notify(`Fetching data from liquidity pool...`);
    const pool = await new BeetsClient().getPool(poolId, anonChainNameToGqlChain(chainName) as GqlChain, account);
    if (!pool) return toResult(`Could not find pool with ID ${poolId}`, true);
    options.notify(`Pool info: "${pool.name}" of type ${formatPoolType(pool.type)}`);
    const poolState = await fromGqlPoolMinimalToBalancerPoolStateWithUnderlyings(pool);

    // WETH liquidity will be returned as ETH
    const wethIsEth = true;

    // Check that the user has liquidity in the pool
    if (!pool.userBalance || Number(pool.userBalance.totalBalance) === 0) return toResult(`You do not have any liquidity in pool '${pool.name}'`, true);

    // Check that the user has no staked positions in the pool
    // TODO: Handle staking with optional argument "unstakeIfNeeded"
    if (pool.userBalance.stakedBalances.length > 0)
        return toResult(`You have ${pool.userBalance.stakedBalances.length} staked positions in this pool.  Unstake and then try again removing liquidity.`, true);

    // Amount of user liquidity in the pool.  For reference, the user balance looks like this:
    // {
    //     "totalBalance": "0.5802072498336482",      // string
    //     "totalBalanceUsd": 0.3187060258642837,     // number
    //     "walletBalance": "0.580207249833648245",   // string
    //     "walletBalanceUsd": 0.3187060258642837,    // number
    //     "stakedBalances": []
    // }
    const userWalletLiquidity = pool.userBalance.walletBalance;
    const userWalletLiquidityInWei = parseUnits(userWalletLiquidity, 18);
    const userWalletLiquidityUsd = pool.userBalance.walletBalanceUsd;
    options.notify(`You have ${to$$$(userWalletLiquidityUsd)} of liquidity in the pool (${toSignificant(Number(userWalletLiquidity))} LP tokens)`);

    // Calculate the amount of liquidity to remove
    let liquidityToRemoveInWei;
    const liquidityToRemoveUsd = userWalletLiquidityUsd * removalPercentageAsDecimal;
    if (removalPercentage === '100') {
        liquidityToRemoveInWei = userWalletLiquidityInWei;
        options.notify(`Will remove all liquidity from the pool`);
    } else {
        liquidityToRemoveInWei = (userWalletLiquidityInWei * BigInt(removalPercentage)) / 100n;
        options.notify(
            `Will remove ${removalPercentage}% of your liquidity from the pool for a total of ${to$$$(liquidityToRemoveUsd)} (${toHumanReadableAmount(liquidityToRemoveInWei, 18)} LP tokens)`,
        );
    }

    // BUILD REMOVE LIQUIDITY TRANSACTION

    // We will request a proportional removal, which means that
    // will receive tokens proportionally to the token pools,
    // to minimze slippage

    const liquidityToRemoveAmount: InputAmount = { rawAmount: liquidityToRemoveInWei, decimals: 18, address: poolState.address };
    const publicClient = options.getProvider(chainId);
    const rpcUrl = getDefaultRpcUrl(publicClient);
    if (!rpcUrl) throw new Error(`Chain ${chainName} not supported by viem`);
    const removeLiquidityInput: RemoveLiquidityInput | RemoveLiquidityBoostedProportionalInput = {
        chainId,
        rpcUrl,
        bptIn: liquidityToRemoveAmount,
        kind: RemoveLiquidityKind.Proportional,
    };

    let queryOutput: RemoveLiquidityQueryOutput | RemoveLiquidityBoostedQueryOutput;
    let buildOutput: RemoveLiquidityBuildCallOutput;
    const transactions: TransactionParams[] = [];
    let addressToApprove: Address | null;

    // Handle special case: the user wants to add liquidity to a boosted token.
    // Tokens in a boosted pool have an underlying token, which is usually
    // the token the user wants to add to the pool.  For example, the
    // Boosted Stable Rings pool has BeefyUSDC.e as the actual token, while
    // the underlying token is USDC.e.  To provide liquidity in the underlying
    // we need a special flow.  For reference, see:
    // https://github.com/balancer/b-sdk/blob/516070ac7b2b16127e8c78be20354874c52548bf/test/v3/addLiquidityBoosted/addLiquidityBoosted.integration.test.ts#L477-L505
    if (isBoostedPool(pool)) {
        options.notify(`Boosted pool detected`);
        const removeLiquidityBoosted = new RemoveLiquidityBoostedV3();
        // Make sure to request the unwrapped token (e.g. USDC.e and not BeefyUSDC.e)
        const tokensOutAddresses = poolState.tokens.map((token) => token.underlyingToken?.address ?? token.address);
        // Query removeLiquidity to get the token out amounts
        const queryInputBoosted = { ...removeLiquidityInput, tokensOut: tokensOutAddresses } as RemoveLiquidityBoostedProportionalInput;
        queryOutput = await removeLiquidityBoosted.query(queryInputBoosted, poolState);
        // Build the actual call data (and apply slippage)
        const buildInput = { ...queryOutput, slippage, chainId, wethIsEth } as RemoveLiquidityBoostedBuildCallInput;
        buildOutput = removeLiquidityBoosted.buildCall(buildInput);
        addressToApprove = buildOutput.to; // will approve the Balancer router
    } else {
        // Query removeLiquidity to get the token out amounts
        const removeLiquidity = new RemoveLiquidity();
        queryOutput = await removeLiquidity.query(removeLiquidityInput, poolState);
        const buildInput = { ...queryOutput, slippage, chainId, wethIsEth } as RemoveLiquidityBaseBuildCallInput;
        // Build the actual call data (and apply slippage)
        // In v2 the sender/recipient can be set, in v3 it is always the msg.sender
        if (queryOutput.protocolVersion === 2) {
            buildOutput = removeLiquidity.buildCall({ ...buildInput, sender: account as `0x${string}`, recipient: account as `0x${string}` });
            addressToApprove = null; // v2 pools don't require an approval
        } else {
            buildOutput = removeLiquidity.buildCall(buildInput);
            addressToApprove = buildOutput.to; // will approve the Balancer router
        }
    }

    if (addressToApprove) {
        await checkToApprove({
            args: { account, target: pool.address, spender: addressToApprove, amount: buildOutput.maxBptIn.amount },
            provider: publicClient,
            transactions,
        });
    }

    transactions.push({
        target: buildOutput.to as Address,
        data: buildOutput.callData,
        value: buildOutput.value,
    });

    // Build a human readable string containing the amount out of each token.
    // The tokens symbols and decimals can be found in pool.poolTokens
    let expectedTokenStrings: string[] = [];
    let minTokenStrings: string[] = [];
    for (let i = 0; i < queryOutput.amountsOut.length; i++) {
        const amountOut = queryOutput.amountsOut[i].amount;
        if (amountOut === 0n) continue; // can happen with nested pools
        const tokenOut = await getBalancerTokenByAddress(chainName, queryOutput.amountsOut[i].token.address);
        if (!tokenOut) continue;
        let tokenOutSymbol = tokenOut.symbol as string;
        if (wethIsEth) tokenOutSymbol = getUnwrappedSymbol(tokenOutSymbol, tokenOut.address, chainId);
        const minAmountOut = buildOutput.minAmountsOut[i].amount;
        expectedTokenStrings.push(`${toHumanReadableAmount(amountOut, tokenOut.decimals)} ${tokenOutSymbol}`);
        minTokenStrings.push(`${toHumanReadableAmount(minAmountOut, tokenOut.decimals)} ${tokenOutSymbol}`);
    }
    await options.notify(
        `Removing liquidity from pool ${pool.name}:\n` +
            `- Remove ${removalPercentage}% of your liquidity for a total of ${to$$$(liquidityToRemoveUsd)} (${toHumanReadableAmount(liquidityToRemoveInWei, 18)} LP tokens)\n` +
            `- Expected tokens you'll receive: ${expectedTokenStrings.join(', ')}\n` +
            `- Minimum tokens you'll receive: ${minTokenStrings.join(', ')}`,
    );

    // Send transactions
    await options.notify(transactions.length > 1 ? `Sending approve & remove liquidity transactions...` : 'Sending remove liquidity transaction...');
    const result = await options.sendTransactions({ chainId, account, transactions });
    const message = result.data[result.data.length - 1].message;
    return toResult(`Successfully removed liquidity from pool ${pool.name}. ${message}`);
}

import { Address, parseUnits } from 'viem';
import { FunctionReturn, FunctionOptions, getChainFromName, toResult, checkToApprove, TransactionParams } from '@heyanon/sdk';
import {
    AddLiquidityKind,
    AddLiquidity,
    InputAmount,
    Permit2Helper,
    AddLiquidityBuildCallInput,
    PERMIT2,
    AddLiquidityBoostedV3,
    AddLiquidityBoostedBuildCallInput,
    AddLiquidityQueryOutput,
    AddLiquidityBoostedQueryOutput,
    AddLiquidityUnbalancedInput,
    AddLiquidityBoostedUnbalancedInput,
} from '@balancer/sdk';
import { DEFAULT_SLIPPAGE_AS_PERCENTAGE, NATIVE_TOKEN_ADDRESS, supportedChains } from '../constants';
import { validateSlippageAsPercentage, validateTokenPositiveDecimalAmount, validateTokenBalances, validateTokenPairInPool } from '../helpers/validation';
import { toHumanReadableAmount, getBalancerTokenByAddress } from '../helpers/tokens';
import { AddLiquidityBuildCallOutput } from '@balancer/sdk';
import { Slippage } from '@balancer/sdk';
import { anonChainNameToBalancerChainId, anonChainNameToGqlChain, getDefaultRpcUrl } from '../helpers/chains';
import { BeetsClient } from '../helpers/beets/client';
import { GqlChain } from '../helpers/beets/types';
import { formatPoolType, fromGqlPoolMinimalToBalancerPoolStateWithUnderlyings, isBoostedPoolToken } from '../helpers/pools';
import { getMockPublicWalletClient } from '../helpers/viem';

interface Props {
    chainName: string;
    account: Address;
    poolId: string;
    token0Address: Address;
    token0Amount: string;
    token1Address: Address | null;
    token1Amount: string | null;
    slippageAsPercentage: `${number}` | null;
}

/**
 * TODO:
 * - fix boosted pools add liquidity (https://github.com/balancer/docs-v3/pull/232#pullrequestreview-2610451961)
 * - support for underlying tokens, e.g. add USDC.e to Boosted Stable Rings pool (same as above?)
 * - getPoolFromName getter, so that the user can add to a pool by its name
 * - test wethIsEth=true
 * - make swap notify message multi-line like for add liquidity
 * - Once you implement boosted pools, decide whether to leave the implementation here (and rename the tool to
 *   addLiquidity) or move it to a new addLiquidityBoosted tool
 * - Implement check on minimum amount that can be added to a boosted pool
 *
 * DONE:
 * - getPool GraphQL endpoint, so that we can show the name of the pool
 * - fix V3 pools add liquidity (https://github.com/balancer/b-sdk/blob/516070ac7b2b16127e8c78be20354874c52548bf/examples/addLiquidity/addLiquidityWithPermit2Signature.ts#L146-L157)
 */
export async function addLiquidityUnbalanced(
    { chainName, account, poolId, token0Address, token0Amount, token1Address, token1Amount, slippageAsPercentage }: Props,
    options: FunctionOptions,
): Promise<FunctionReturn> {
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Beets protocol is not supported on ${chainName}`, true);
    if (token0Address === token1Address) return toResult(`Tokens cannot have the same address`, true);

    // Validate amounts
    if (!validateTokenPositiveDecimalAmount(token0Amount)) return toResult(`Invalid amount for token #0: ${token0Amount}`, true);
    if (token1Amount !== null && !validateTokenPositiveDecimalAmount(token1Amount)) return toResult(`Invalid amount for token #1: ${token1Amount}`, true);
    if (token1Address && !token1Amount) return toResult(`Token #1 address provided but no amount`, true);
    if (!token1Address && token1Amount) return toResult(`Token #1 amount provided but no address`, true);

    // Parse and validate slippage
    slippageAsPercentage = slippageAsPercentage ?? `${DEFAULT_SLIPPAGE_AS_PERCENTAGE}`;
    if (!validateSlippageAsPercentage(slippageAsPercentage)) return toResult(`Invalid slippage: ${slippageAsPercentage}`, true);
    const slippage = Slippage.fromPercentage(slippageAsPercentage);

    // Get token information
    const token0 = await getBalancerTokenByAddress(chainName, token0Address);
    if (!token0) return toResult(`Could not find info on first token (${token0Address})`, true);
    const token1 = token1Address ? await getBalancerTokenByAddress(chainName, token1Address) : null;
    if (token1Address && !token1) return toResult(`Could not find info on second token (${token1Address})`, true);

    // Get balancer chain ID
    const balancerChainId = anonChainNameToBalancerChainId(chainName);
    if (!balancerChainId) return toResult(`Chain ${chainName} not supported by SDK`, true);

    // Get pool from Balancer API
    await options.notify(`Fetching data from liquidity pool...`);
    const pool = await new BeetsClient().getPool(poolId, anonChainNameToGqlChain(chainName) as GqlChain);
    if (!pool) return toResult(`Could not find pool with ID ${poolId}`, true);
    options.notify(`Pool: "${pool.name}" of type ${formatPoolType(pool.type)}`);
    const poolState = await fromGqlPoolMinimalToBalancerPoolStateWithUnderlyings(pool);

    // Validate that the tokens are in the pool
    const [tokensValid, tokensError] = await validateTokenPairInPool(chainName, pool, token0Address, token1Address);
    if (!tokensValid) return toResult(tokensError!, true);

    // Check balances
    const publicClient = options.getProvider(chainId);
    const tokensToCheck = [{ address: token0Address, amount: token0Amount }];
    if (token1Address && token1Amount) tokensToCheck.push({ address: token1Address, amount: token1Amount });
    const [hasBalance, balanceError] = await validateTokenBalances(publicClient, account, tokensToCheck);
    if (!hasBalance) return toResult(balanceError!, true);

    // Parse amounts to wei (now that we know the amounts are valid)
    const amount0InWei = parseUnits(token0Amount, token0.decimals);
    const amount1InWei = token1Amount && token1 ? parseUnits(token1Amount, token1.decimals) : null;

    // Prepare input amounts for SDK
    const amountsIn: InputAmount[] = [{ address: token0Address, decimals: token0.decimals, rawAmount: amount0InWei }];
    if (token1Address && amount1InWei && token1) amountsIn.push({ address: token1Address, decimals: token1.decimals, rawAmount: amount1InWei });
    amountsIn.sort((a, b) => (a.address.toLowerCase() < b.address.toLowerCase() ? -1 : 1));

    // Construct the AddLiquidityInput
    const rpcUrl = getDefaultRpcUrl(publicClient);
    if (!rpcUrl) throw new Error(`Chain ${chainName} not supported by viem`);
    const addLiquidityInput: AddLiquidityUnbalancedInput | AddLiquidityBoostedUnbalancedInput = {
        amountsIn,
        chainId,
        rpcUrl,
        kind: AddLiquidityKind.Unbalanced,
    };

    // BUILD ADD LIQUIDITY TRANSACTION
    let buildOutput: AddLiquidityBuildCallOutput;
    const transactions: TransactionParams[] = [];
    let addressToApprove: Address;
    let bptOut: bigint;
    let queryOutput: AddLiquidityQueryOutput | AddLiquidityBoostedQueryOutput;
    const wethIsEth = false; // TODO: add support for wethIsEth

    // Handle special case: the user wants to add liquidity to a boosted token.
    // Tokens in a boosted pool have an underlying token, which is usually
    // the token the user wants to add to the pool.  For example, the
    // Boosted Stable Rings pool has BeefyUSDC.e as the actual token, while
    // the underlying token is USDC.e.  To provide liquidity in the underlying
    // we need a special flow.  For reference, see:
    // https://github.com/balancer/b-sdk/blob/516070ac7b2b16127e8c78be20354874c52548bf/test/v3/addLiquidityBoosted/addLiquidityBoosted.integration.test.ts#L477-L505
    if (isBoostedPoolToken(pool, token0Address) || (token1Address && isBoostedPoolToken(pool, token1Address))) {
        options.notify(`Boosted pool token detected`);
        addressToApprove = PERMIT2[balancerChainId];
        const addLiquidityBoosted = new AddLiquidityBoostedV3();
        queryOutput = await addLiquidityBoosted.query(addLiquidityInput, poolState);
        const buildInput = { ...queryOutput, slippage, wethIsEth } as AddLiquidityBoostedBuildCallInput;
        // Sign the permit2 approvals
        const permit2 = await Permit2Helper.signAddLiquidityBoostedApproval({ ...buildInput, client: getMockPublicWalletClient(publicClient, options), owner: account });
        // Build add-liquidity call, including permit2 approvals
        buildOutput = addLiquidityBoosted.buildCallWithPermit2(buildInput, permit2);
    } else {
        // Query addLiquidity to get expected BPT out
        const addLiquidity = new AddLiquidity();
        queryOutput = await addLiquidity.query(addLiquidityInput, poolState);

        const buildInput = { ...queryOutput, slippage, wethIsEth } as AddLiquidityBuildCallInput;
        // In v2 the sender/recipient can be set, in v3 it is always the msg.sender
        if (queryOutput.protocolVersion === 2) {
            buildOutput = addLiquidity.buildCall({
                ...buildInput,
                sender: account as `0x${string}`,
                recipient: account as `0x${string}`,
            });
            // The address to approve is the balancer vault
            addressToApprove = buildOutput.to;
        } else {
            addressToApprove = PERMIT2[balancerChainId];
            // Sign the permit2 approvals
            const permit2 = await Permit2Helper.signAddLiquidityApproval({ ...buildInput, client: getMockPublicWalletClient(publicClient, options), owner: account });
            // Build add-liquidity call, including permit2 approvals
            buildOutput = addLiquidity.buildCallWithPermit2(buildInput, permit2);
        }
    }
    bptOut = queryOutput.bptOut.amount;

    // Build approval transactions (if needed)
    if (token0Address !== NATIVE_TOKEN_ADDRESS) {
        await checkToApprove({
            args: { account, target: token0Address, spender: addressToApprove, amount: amount0InWei },
            provider: publicClient,
            transactions,
        });
    }
    if (token1Address && amount1InWei && token1Address !== NATIVE_TOKEN_ADDRESS) {
        await checkToApprove({
            args: { account, target: token1Address, spender: addressToApprove, amount: amount1InWei },
            provider: publicClient,
            transactions,
        });
    }

    // Add the join transaction
    transactions.push({
        target: buildOutput.to as Address,
        data: buildOutput.callData,
        value: buildOutput.value,
    });

    // Notify user
    await options.notify(
        `Adding liquidity to pool ${poolId}:\n` +
            `- ${token0Amount} ${token0.symbol}\n` +
            (token1 ? `- ${token1Amount} ${token1.symbol}\n` : '') +
            `Expected BPT Out: ${toHumanReadableAmount(bptOut, 18)}\n` +
            `Min BPT Out: ${toHumanReadableAmount(buildOutput.minBptOut.amount, 18)}`,
    );

    // Send transactions
    await options.notify(transactions.length > 1 ? `Sending approve & add liquidity transactions...` : 'Sending add liquidity transaction...');
    const result = await options.sendTransactions({ chainId, account, transactions });
    const message = result.data[result.data.length - 1].message;
    return toResult(`Successfully added liquidity to pool ${poolId}. ${message}`);
}

import { Address, erc20Abi, parseUnits, SignTypedDataParameters } from 'viem';
import { FunctionReturn, FunctionOptions, getChainFromName, toResult, checkToApprove, TransactionParams } from '@heyanon/sdk';
import {
    AddLiquidityInput,
    AddLiquidityKind,
    AddLiquidity,
    InputAmount,
    AddLiquidityQueryOutput,
    Permit2Helper,
    AddLiquidityBuildCallInput,
    PublicWalletClient,
} from '@balancer/sdk';
import { DEFAULT_SLIPPAGE_AS_PERCENTAGE, NATIVE_TOKEN_ADDRESS, supportedChains } from '../constants';
import { validateSlippageAsPercentage, validateTokenPositiveDecimalAmount } from '../helpers/validation';
import { toHumanReadableAmount, getBalancerTokenByAddress } from '../helpers/tokens';
import { BalancerApi, AddLiquidityBuildCallOutput } from '@balancer/sdk';
import { Slippage } from '@balancer/sdk';
import { anonChainNameToBalancerChainId, getDefaultRpcUrl } from '../helpers/chains';

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
 * - fix V3 pools add liquidity (https://github.com/balancer/b-sdk/blob/516070ac7b2b16127e8c78be20354874c52548bf/examples/addLiquidity/addLiquidityWithPermit2Signature.ts#L146-L157)
 * - getPool GraphQL endpoint, so that we can show the name of the pool
 * - test wethIsEth=true
 * - getTokenAddressFromSymbol getter, so that the user can add to a pool by its name
 * - make swap notify message multi-line like for add liquidity
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
    if (!validateTokenPositiveDecimalAmount(token0Amount)) return toResult(`Invalid amount for token 0: ${token0Amount}`, true);
    if (token1Amount !== null && !validateTokenPositiveDecimalAmount(token1Amount)) return toResult(`Invalid amount for token 1: ${token1Amount}`, true);
    if (token1Address && !token1Amount) return toResult(`Token 1 address provided but no amount`, true);
    if (!token1Address && token1Amount) return toResult(`Token 1 amount provided but no address`, true);

    // Parse and validate slippage
    slippageAsPercentage = slippageAsPercentage ?? `${DEFAULT_SLIPPAGE_AS_PERCENTAGE}`;
    if (!validateSlippageAsPercentage(slippageAsPercentage)) return toResult(`Invalid slippage: ${slippageAsPercentage}`, true);

    // Get token information
    const token0 = await getBalancerTokenByAddress(chainName, token0Address);
    if (!token0) return toResult(`Could not find info on first token (${token0Address})`, true);
    const token1 = token1Address ? await getBalancerTokenByAddress(chainName, token1Address) : null;
    if (token1Address && !token1) return toResult(`Could not find info on second token (${token1Address})`, true);

    // Get balancer chain ID
    const balancerChainId = anonChainNameToBalancerChainId(chainName);
    if (!balancerChainId) return toResult(`Chain ${chainName} not supported by SDK`, true);

    // Get pool state from Balancer API
    const balancerClient = new BalancerApi('https://backend-v3.beets-ftm-node.com/', balancerChainId);
    const poolState = await balancerClient.pools.fetchPoolState(poolId);
    if (!poolState) {
        return toResult(`Could not find pool with ID ${poolId}`, true);
    }

    // Verify tokens are in pool
    try {
        const poolTokens = await Promise.all(
            poolState.tokens.map(async (t, i) => {
                const tokenInfo = await getBalancerTokenByAddress(chainName, t.address);
                if (!tokenInfo) throw new Error(`Could not find info on token ${i + 1} (${t.address})`);
                return tokenInfo;
            }),
        );
        const poolTokensAddresses = poolTokens.map((t) => t.address);
        if (!poolTokensAddresses.includes(token0Address))
            return toResult(`Token ${token0.symbol} is not among the pool's tokens: ${poolTokens.map((t) => t.symbol).join(', ')}`, true);
        if (token1Address && !poolTokensAddresses.includes(token1Address))
            return toResult(`Token ${token1?.symbol} is not among the pool's tokens: ${poolTokens.map((t) => t.symbol).join(', ')}`, true);
    } catch (error) {
        return toResult(`Error verifying tokens are in pool: ${error}`, true);
    }

    // Parse amounts to wei
    const amount0InWei = parseUnits(token0Amount, token0.decimals);
    const amount1InWei = token1Amount && token1 ? parseUnits(token1Amount, token1.decimals) : null;

    // Check balances
    const publicClient = options.getProvider(chainId);
    let balance0: bigint;
    if (token0Address === NATIVE_TOKEN_ADDRESS) {
        balance0 = await publicClient.getBalance({ address: account });
    } else {
        balance0 = await publicClient.readContract({
            address: token0Address,
            abi: erc20Abi,
            functionName: 'balanceOf',
            args: [account],
        });
    }
    if (balance0 < amount0InWei) {
        return toResult(`Not enough tokens: you have ${toHumanReadableAmount(balance0, token0.decimals)} ${token0.symbol}, need ${token0Amount} ${token0.symbol}`);
    }

    if (token1Address && amount1InWei) {
        let balance1: bigint;
        if (token1Address === NATIVE_TOKEN_ADDRESS) {
            balance1 = await publicClient.getBalance({ address: account });
        } else {
            balance1 = await publicClient.readContract({
                address: token1Address,
                abi: erc20Abi,
                functionName: 'balanceOf',
                args: [account],
            });
        }
        if (balance1 < amount1InWei) {
            return toResult(`Not enough tokens: you ${toHumanReadableAmount(balance1, token1!.decimals)} ${token1!.symbol}, you need ${token1Amount} ${token1!.symbol}`);
        }
    }

    // Prepare input amounts for SDK
    const amountsIn: InputAmount[] = [
        {
            address: token0Address,
            decimals: token0.decimals,
            rawAmount: amount0InWei,
        },
    ];

    if (token1Address && amount1InWei && token1) {
        amountsIn.push({
            address: token1Address,
            decimals: token1.decimals,
            rawAmount: amount1InWei,
        });
    }

    // Construct the AddLiquidityInput
    const rpcUrl = getDefaultRpcUrl(publicClient);
    if (!rpcUrl) throw new Error(`Chain ${chainName} not supported by viem`);
    const addLiquidityInput: AddLiquidityInput = {
        amountsIn,
        chainId,
        rpcUrl,
        kind: AddLiquidityKind.Unbalanced,
    };

    await options.notify(`Fetching data from liquidity pool...`);

    let queryOutput: AddLiquidityQueryOutput;
    const addLiquidity = new AddLiquidity();
    try {
        // Query addLiquidity to get expected BPT out
        queryOutput = await addLiquidity.query(addLiquidityInput, poolState);
    } catch (error) {
        return toResult(`Error querying liquidity: ${error}`, true);
    }

    // Build the call with slippage
    const slippage = Slippage.fromPercentage(slippageAsPercentage);
    const buildInput = { ...queryOutput, slippage, chainId, wethIsEth: false } as AddLiquidityBuildCallInput;
    let buildOutput: AddLiquidityBuildCallOutput;
    // In v2 the sender/recipient can be set, in v3 it is always the msg.sender
    if (queryOutput.protocolVersion === 2) {
        buildOutput = addLiquidity.buildCall({
            ...buildInput,
            sender: account as `0x${string}`,
            recipient: account as `0x${string}`,
        });
    } else {
        // Sign permit2 approvals
        // Create a PublicWalletClient by extending the PublicClient with signTypedData
        const publicWalletClient = publicClient.extend((client) => ({
            signTypedData: async (typedData: SignTypedDataParameters) => {
                if (!options.signTypedDatas) {
                    throw new Error('signTypedDatas not provided in options');
                }
                const signatures = await options.signTypedDatas([typedData]);
                return signatures[0];
            },
        })) as unknown as PublicWalletClient;

        const permit2 = await Permit2Helper.signAddLiquidityApproval({
            ...buildInput,
            client: publicWalletClient,
            owner: account,
        });

        // Build call with permit2 approvals
        buildOutput = addLiquidity.buildCallWithPermit2(buildInput, permit2);
    }

    const transactions: TransactionParams[] = [];

    // Handle approvals
    if (token0Address !== NATIVE_TOKEN_ADDRESS) {
        await checkToApprove({
            args: { account, target: token0Address, spender: buildOutput.to, amount: amount0InWei },
            provider: publicClient,
            transactions,
        });
    }

    if (token1Address && amount1InWei && token1Address !== NATIVE_TOKEN_ADDRESS) {
        await checkToApprove({
            args: { account, target: token1Address, spender: buildOutput.to, amount: amount1InWei },
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
            `Expected BPT Out: ${toHumanReadableAmount(queryOutput.bptOut.amount, 18)}\n` +
            `Min BPT Out: ${toHumanReadableAmount(buildOutput.minBptOut.amount, 18)}`,
    );

    // Send transactions
    await options.notify(transactions.length > 1 ? `Sending approve & add liquidity transactions...` : 'Sending add liquidity transaction...');
    const result = await options.sendTransactions({ chainId, account, transactions });
    const message = result.data[result.data.length - 1].message;
    return toResult(`Successfully added liquidity to pool ${poolId}. ${message}`);
}

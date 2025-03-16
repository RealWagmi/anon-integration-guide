import { Address, parseUnits } from 'viem';
import { EVM, FunctionReturn, FunctionOptions, toResult, EvmChain } from '@heyanon/sdk';
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
    AddLiquidityBoostedInput,
    AddLiquidityInput,
    AddLiquidityBoostedProportionalInput,
    AddLiquidityBoostedUnbalancedInput,
} from '@balancer/sdk';
import { DEFAULT_SLIPPAGE_AS_PERCENTAGE, NATIVE_TOKEN_ADDRESS, supportedChains } from '../constants';
import { validatePercentage, validateTokenPositiveDecimalAmount, validateTokenBalances, validateTokensAreInPool } from '../helpers/validation';
import { toHumanReadableAmount, getBalancerTokenByAddress, getWrappedToken } from '../helpers/tokens';
import { AddLiquidityBuildCallOutput } from '@balancer/sdk';
import { Slippage } from '@balancer/sdk';
import { anonChainNameToBalancerChainId, anonChainNameToGqlChain, getDefaultRpcUrl } from '../helpers/chains';
import { BeetsClient } from '../helpers/beets/client';
import { GqlChain } from '../helpers/beets/types';
import { formatPoolType, fromGqlPoolMinimalToBalancerPoolStateWithUnderlyings, isBoostedPoolToken, isProportionalPool } from '../helpers/pools';
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
 * Adds liquidity to a Balancer pool. Can handle both regular and boosted pools.
 * For boosted pools, it automatically handles adding liquidity using the underlying token.
 *
 * @param {Object} props - The input parameters
 * @param {string} props.chainName - Name of the blockchain network
 * @param {Address} props.account - Address of the account adding liquidity
 * @param {string} props.poolId - ID of the Balancer pool
 * @param {Address} props.token0Address - Address of the first token to add
 * @param {string} props.token0Amount - Amount of first token in decimal form (e.g. "1.5" rather than "1500000000000000000")
 * @param {Address|null} props.token1Address - Optional address of second token.  If omitted, the first token will be added as a single token.
 * @param {string|null} props.token1Amount - Optional amount of second token in decimal form (e.g. "1.5" rather than "1500000000000000000")
 * @param {`${number}`|null} props.slippageAsPercentage - Maximum acceptable slippage as percentage (e.g. "1" for 1%)
 * @param {FunctionOptions} options - HeyAnon SDK options, including provider and notification handlers
 * @returns {Promise<FunctionReturn>} Result of the liquidity addition with transaction hash
 * @throws Will throw if token approvals fail or if the pool/token validation fails
 */
export async function addLiquidity(
    { chainName, account, poolId, token0Address, token0Amount, token1Address, token1Amount, slippageAsPercentage }: Props,
    options: FunctionOptions,
): Promise<FunctionReturn> {
    const chainId = EVM.utils.getChainFromName(chainName as EvmChain);
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
    if (!validatePercentage(slippageAsPercentage)) return toResult(`Invalid slippage: ${slippageAsPercentage}`, true);
    const slippage = Slippage.fromPercentage(slippageAsPercentage);

    // Get token information
    const token0 = await getBalancerTokenByAddress(chainName, token0Address);
    if (!token0) return toResult(`Could not find info on first token (${token0Address})`, true);
    let token1 = token1Address ? await getBalancerTokenByAddress(chainName, token1Address) : null;
    if (token1Address && !token1) return toResult(`Could not find info on second token (${token1Address})`, true);

    // Get balancer chain ID
    const balancerChainId = anonChainNameToBalancerChainId(chainName);
    if (!balancerChainId) return toResult(`Chain ${chainName} not supported by SDK`, true);

    // Get pool from Balancer API
    await options.notify(`Fetching data from liquidity pool...`);
    const pool = await new BeetsClient().getPool(poolId, anonChainNameToGqlChain(chainName) as GqlChain);
    if (!pool) return toResult(`Could not find pool with ID ${poolId}`, true);
    options.notify(`Pool info: "${pool.name}" of type ${formatPoolType(pool.type)}`);
    const poolState = await fromGqlPoolMinimalToBalancerPoolStateWithUnderlyings(pool);

    // Validate that the tokens are in the pool
    const tokensToValidate = [token0Address];
    if (token1Address) tokensToValidate.push(token1Address);
    const [tokensValid, tokensError] = await validateTokensAreInPool(chainName, pool, tokensToValidate);
    if (!tokensValid) return toResult(tokensError!, true);

    // Check if either of the tokens is the native token
    const wethIsEth = token0Address === NATIVE_TOKEN_ADDRESS || token1Address === NATIVE_TOKEN_ADDRESS;

    // Check balances
    options.notify('Checking balances...');
    const publicClient = options.evm.getProvider(chainId);
    const tokensToCheck = [{ address: token0Address, amount: token0Amount }];
    if (token1Address && token1Amount) tokensToCheck.push({ address: token1Address, amount: token1Amount });
    const [hasBalance, balanceError] = await validateTokenBalances(publicClient, account, tokensToCheck);
    if (!hasBalance) return toResult(balanceError!, true);

    // Some pools require tokens to be added proportionally to
    // the current ratio of tokens in the pool.
    if (isProportionalPool(pool)) {
        options.notify(`Proportional pool detected`);
        if (pool.poolTokens.length > 2) {
            return toResult(`Proportional pools with more than 2 tokens are not supported yet`, true);
        }
        if (token1Amount !== null) {
            return toResult(`Do not specify amount for ${token1?.symbol}: it will be computed automatically in a proportional manner`, true);
        }
    }

    // Parse amounts to wei (now that we know the amounts are valid)
    const amount0InWei = parseUnits(token0Amount, token0.decimals);
    let amount1InWei = token1Amount && token1 ? parseUnits(token1Amount, token1.decimals) : null;

    // Prepare input amounts for SDK
    const amountsIn: InputAmount[] = [{ address: getWrappedToken(token0Address, chainId), decimals: token0.decimals, rawAmount: amount0InWei }];
    if (token1Address && amount1InWei && token1) amountsIn.push({ address: getWrappedToken(token1Address, chainId), decimals: token1.decimals, rawAmount: amount1InWei });

    // Construct the AddLiquidityInput
    const rpcUrl = getDefaultRpcUrl(publicClient);
    if (!rpcUrl) throw new Error(`Chain ${chainName} not supported by viem`);
    let addLiquidityInput: AddLiquidityBoostedInput | AddLiquidityInput;
    if (isProportionalPool(pool)) {
        // Proportional pools require that liquidity is added in the same proportion
        // as the current token balances in the pool.  This means that only one
        // token amount needs to be specified: the reference amount.
        addLiquidityInput = {
            referenceAmount: amountsIn[0],
            chainId,
            rpcUrl,
            kind: AddLiquidityKind.Proportional,
        };
    } else {
        // For non-proportional pools, one can add liquidity using arbitrary amounts
        // for each token.
        addLiquidityInput = {
            amountsIn,
            chainId,
            rpcUrl,
            kind: AddLiquidityKind.Unbalanced,
        };
    }

    // BUILD ADD LIQUIDITY TRANSACTION
    let buildOutput: AddLiquidityBuildCallOutput;
    const transactions: EVM.types.TransactionParams[] = [];
    let addressToApprove: Address;
    let bptOut: bigint;
    let queryOutput: AddLiquidityQueryOutput | AddLiquidityBoostedQueryOutput;

    // Handle special case: the user wants to add liquidity to a boosted token.
    // Tokens in a boosted pool have an underlying token, which is usually
    // the token the user wants to add to the pool.  For example, the
    // Boosted Stable Rings pool has BeefyUSDC.e as the actual token, while
    // the underlying token is USDC.e.  To provide liquidity in the underlying
    // we need a special flow.  For reference, see:
    // https://github.com/balancer/b-sdk/blob/516070ac7b2b16127e8c78be20354874c52548bf/test/v3/addLiquidityBoosted/addLiquidityBoosted.integration.test.ts#L477-L505
    if (isBoostedPoolToken(pool, token0Address, chainId) || (token1Address && isBoostedPoolToken(pool, token1Address, chainId))) {
        options.notify(`Boosted pool token detected`);
        let addLiquidityBoostedInput: AddLiquidityBoostedInput;
        if (isProportionalPool(pool)) {
            // When adding proportionally to boosted pools, we need to explicitly
            // specify that you want to automatically wrap the token.
            addLiquidityBoostedInput = { ...addLiquidityInput, tokensIn: [token0Address] } as AddLiquidityBoostedProportionalInput;
        } else {
            // Otherwise, it's the same input as for non-boosted pools.
            addLiquidityBoostedInput = { ...addLiquidityInput } as AddLiquidityBoostedUnbalancedInput;
        }
        addressToApprove = PERMIT2[balancerChainId];
        const addLiquidityBoosted = new AddLiquidityBoostedV3();
        queryOutput = await addLiquidityBoosted.query(addLiquidityBoostedInput, poolState);
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

    // For proportional pools, a certain amount of token1 will always be added,
    // even if token1Amount is not specified.  This amount was computed
    // automatically by the query.
    if (isProportionalPool(pool)) {
        // Find the position of token1 in the query output (this works because we
        // ensure that the pool has at most 2 tokens).
        const token1IndexInQuery = queryOutput.amountsIn.findIndex((el) => el.token.address.toLowerCase() !== token0Address.toLowerCase());
        token1Address = queryOutput.amountsIn[token1IndexInQuery].token.address;
        token1 = await getBalancerTokenByAddress(chainName, token1Address);
        if (!token1) return toResult(`Could not find info on second token (${token1Address})`, true);
        token1Amount = toHumanReadableAmount(queryOutput.amountsIn[token1IndexInQuery].amount, token1.decimals);
        amount1InWei = parseUnits(token1Amount, token1.decimals); // lest token1 is not approved
    }

    // Build approval transactions (if needed)
    if (token0Address !== NATIVE_TOKEN_ADDRESS) {
        await EVM.utils.checkToApprove({
            args: { account, target: token0Address, spender: addressToApprove, amount: amount0InWei },
            provider: publicClient,
            transactions,
        });
    }
    if (token1Address && amount1InWei && token1Address !== NATIVE_TOKEN_ADDRESS) {
        await EVM.utils.checkToApprove({
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
        `Adding liquidity to pool ${pool.name}:\n` +
            `- Add ${token0Amount} ${token0.symbol}` +
            (token1 ? ` and ${token1Amount} ${token1.symbol}\n` : '\n') +
            `- Expected liquidity you'll receive: ${toHumanReadableAmount(bptOut, 18)}\n` +
            `- Minimum liquidity you'll receive: ${toHumanReadableAmount(buildOutput.minBptOut.amount, 18)}`,
    );

    // Send transactions
    await options.notify(transactions.length > 1 ? `Sending approve & add liquidity transactions...` : 'Sending add liquidity transaction...');
    const result = await options.evm.sendTransactions({ chainId, account, transactions });
    const message = result.data[result.data.length - 1].message;
    return toResult(result.isMultisig ? message : `Successfully added liquidity to pool ${pool.name}. ${message}`);
}

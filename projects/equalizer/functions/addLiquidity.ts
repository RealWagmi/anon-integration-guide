import { Address, encodeFunctionData, parseUnits } from 'viem';
import { FunctionReturn, FunctionOptions, TransactionParams, toResult, getChainFromName } from '@heyanon/sdk';
import { supportedChains, ROUTER_ADDRESS } from '../constants';
import { routerAbi } from '../abis';
import { checkToApprove } from '@heyanon/sdk';
import { getTokenMetadata } from '../lib/erc20Metadata';

interface Props {
    chainName: string;
    account: Address;
    token0Address: Address;
    token1Address: Address;
    isStable: boolean;
    amount0Desired: string;
    amount1Desired: string;
    amount0Min: string;
    amount1Min: string;
    deadline?: number;
}

/**
 * Adds liquidity to an Equalizer pair on Fantom Opera.
 * @param props - The liquidity parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Transaction result.
 */
export async function addLiquidity(
    {
        chainName,
        account,
        token0Address,
        token1Address,
        isStable,
        amount0Desired,
        amount1Desired,
        amount0Min,
        amount1Min,
        deadline = Math.floor(Date.now() / 1000) + 1200, // 20 minutes from now
    }: Props,
    { sendTransactions, notify, getProvider }: FunctionOptions
): Promise<FunctionReturn> {
    // Check wallet connection
    if (!account) return toResult('Wallet not connected', true);

    // Validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Equalizer is not supported on ${chainName}`, true);

    // Validate addresses
    if (!token0Address || !token1Address) return toResult('Both token addresses are required', true);

    const provider = getProvider(chainId);

    const token0MetadataPromise = getTokenMetadata({
        tokenAddress: token0Address,
        chainName,
        publicClient: provider,
    });
    const token1MetadataPromise = getTokenMetadata({
        tokenAddress: token1Address,
        chainName,
        publicClient: provider,
    });

    const [token0MetadataResult, token1MetadataResult] = await Promise.allSettled([token0MetadataPromise, token1MetadataPromise]);

    if (token0MetadataResult.status === 'rejected' || token1MetadataResult.status === 'rejected') return toResult('Failed to retrieve metadata for one of the tokens', true);

    const token0Metadata = token0MetadataResult.value;
    const token1Metadata = token1MetadataResult.value;

    // Convert amounts to BigInt
    const amount0DesiredBn = parseUnits(amount0Desired, token0Metadata.decimals);
    const amount1DesiredBn = parseUnits(amount1Desired, token1Metadata.decimals);
    const amount0MinBn = parseUnits(amount0Min, token0Metadata.decimals);
    const amount1MinBn = parseUnits(amount1Min, token1Metadata.decimals);

    // Validate amounts
    if (amount0DesiredBn <= 0n || amount1DesiredBn <= 0n) return toResult('Desired amounts must be greater than 0', true);
    if (amount0MinBn <= 0n || amount1MinBn <= 0n) return toResult('Minimum amounts must be greater than 0', true);

    await notify('Preparing to add liquidity...');

    const transactions: TransactionParams[] = [];

    // Check and prepare approve transaction for token0 if needed
    await checkToApprove({
        args: {
            account,
            target: token0Address,
            spender: ROUTER_ADDRESS,
            amount: amount0DesiredBn,
        },
        provider,
        transactions,
    });

    // Check and prepare approve transaction for token1 if needed
    await checkToApprove({
        args: {
            account,
            target: token1Address,
            spender: ROUTER_ADDRESS,
            amount: amount1DesiredBn,
        },
        provider,
        transactions,
    });

    // Prepare add liquidity transaction
    const addLiquidityTx: TransactionParams = {
        target: ROUTER_ADDRESS,
        data: encodeFunctionData({
            abi: routerAbi,
            functionName: 'addLiquidity',
            args: [token0Address, token1Address, isStable, amount0DesiredBn, amount1DesiredBn, amount0MinBn, amount1MinBn, account, BigInt(deadline)],
        }),
    };
    transactions.push(addLiquidityTx);

    await notify('Waiting for transaction confirmation...');

    // Sign and send transactions
    const result = await sendTransactions({ chainId, account, transactions });
    const lpMessage = result.data[result.data.length - 1];

    return toResult(result.isMultisig ? lpMessage.message : `Successfully added liquidity to Equalizer pair. ${lpMessage.message}`);
}
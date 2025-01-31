import { Address, encodeFunctionData, isAddress, parseUnits } from 'viem';
import { FunctionReturn, FunctionOptions, TransactionParams, toResult, getChainFromName } from '@heyanon/sdk';
import { supportedChains, THICKNFT_MANAGER_ADDRESS } from '../constants';
import { thickNftAbi } from '../abis/thickNft';
import { checkToApprove } from '@heyanon/sdk';
import { getTokenMetadata } from '../lib/erc20Metadata';
import { priceToTick, validateTickRange } from '../lib/tickMath';
interface Props {
    chainName: string;
    account: Address;
    token0Address: Address;
    token1Address: Address;
    fee: number;
    priceLower: number; // Changed from tickLower
    priceUpper: number; // Changed from tickUpper
    amount0Desired: string;
    amount1Desired: string;
}

export async function createThickNftPosition(
    { chainName, account, token0Address, token1Address, fee, priceLower, priceUpper, amount0Desired, amount1Desired }: Props,
    { sendTransactions, notify, getProvider }: FunctionOptions
): Promise<FunctionReturn> {
    // Check wallet connection
    if (!account) return toResult('Wallet not connected', true);

    // Validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Equalizer is not supported on ${chainName}`, true);

    // Validate addresses
    if (!isAddress(token0Address) || !isAddress(token1Address)) return toResult('Both token addresses are required', true);

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

    if (token0MetadataResult.status === 'rejected' || token1MetadataResult.status === 'rejected') return toResult('Failed to retrieve token information', true);

    const token0Metadata = token0MetadataResult.value;
    const token1Metadata = token1MetadataResult.value;

    // Convert prices to ticks
    const rawTickLower = priceToTick(priceLower, token0Metadata.decimals, token1Metadata.decimals);
    const rawTickUpper = priceToTick(priceUpper, token0Metadata.decimals, token1Metadata.decimals);

    // Validate and adjust tick range
    const { tickLower, tickUpper } = validateTickRange(rawTickLower, rawTickUpper);

    await notify(`Creating position with price range: ${priceLower} - ${priceUpper} (ticks: ${tickLower} - ${tickUpper})`);

    // Convert amounts to BigInt with proper decimals
    const amount0DesiredBn = parseUnits(amount0Desired, token0Metadata.decimals);
    const amount1DesiredBn = parseUnits(amount1Desired, token1Metadata.decimals);
    // Calculate minimum amounts with 5% slippage tolerance
    const amount0MinBn = (amount0DesiredBn * 95n) / 100n;
    const amount1MinBn = (amount1DesiredBn * 95n) / 100n;

    // Validate amounts
    if (amount0DesiredBn <= 0n || amount1DesiredBn <= 0n) return toResult('Desired amounts must be greater than 0', true);
    if (amount0MinBn <= 0n || amount1MinBn <= 0n) return toResult('Minimum amounts must be greater than 0', true);

    await notify('Preparing to create Thick NFT position...');

    const transactions: TransactionParams[] = [];

    // Check and prepare approve transaction for token0 if needed
    await checkToApprove({
        args: {
            account,
            target: token0Address,
            spender: THICKNFT_MANAGER_ADDRESS,
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
            spender: THICKNFT_MANAGER_ADDRESS,
            amount: amount1DesiredBn,
        },
        provider,
        transactions,
    });

    const deadline = Math.floor(Date.now() / 1000) + 300; // 5 minutes from now

    const params = {
        token0: token0Address,
        token1: token1Address,
        fee: fee,
        tickLower: tickLower,
        tickUpper: tickUpper,
        amount0Desired: amount0DesiredBn,
        amount1Desired: amount1DesiredBn,
        amount0Min: amount0MinBn,
        amount1Min: amount1MinBn,
        recipient: account,
        deadline: BigInt(deadline),
    };

    const mintTx: TransactionParams = {
        target: THICKNFT_MANAGER_ADDRESS,
        data: encodeFunctionData({
            abi: thickNftAbi,
            functionName: 'mint',
            args: [params],
        }),
    };
    transactions.push(mintTx);

    await notify('Waiting for transaction confirmation...');

    const result = await sendTransactions({ chainId, account, transactions });
    const mintMessage = result.data[result.data.length - 1];

    return toResult(result.isMultisig ? mintMessage.message : `Successfully created Thick NFT position. ${mintMessage.message}`);
}

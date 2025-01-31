import { Address, encodeFunctionData, isAddress, parseUnits } from 'viem';
import { FunctionReturn, FunctionOptions, TransactionParams, toResult, getChainFromName } from '@heyanon/sdk';
import { supportedChains } from '../constants';
import { bribeAbi } from '../abis/bribeAbi';
import { checkToApprove } from '@heyanon/sdk';
import { getTokenMetadata } from '../lib/erc20Metadata';

interface Props {
    chainName: string;
    account: Address;
    bribeAddress: Address;
    tokenAddress: Address;
    amount: string;
}

export async function submitBribe(
    { chainName, account, bribeAddress, tokenAddress, amount }: Props,
    { sendTransactions, notify, getProvider }: FunctionOptions
): Promise<FunctionReturn> {
    // Check wallet connection
    if (!account) return toResult('Wallet not connected', true);

    // Validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Equalizer is not supported on ${chainName}`, true);

    // Validate addresses
    if (!isAddress(bribeAddress)) return toResult('Invalid bribe address', true);
    if (!isAddress(tokenAddress)) return toResult('Invalid token address', true);

    const provider = getProvider(chainId);

    // Get token metadata
    const tokenMetadata = await getTokenMetadata({
        tokenAddress,
        chainName,
        publicClient: provider,
    });

    if (!tokenMetadata) return toResult('Failed to retrieve token information', true);

    // Convert amount to BigInt with proper decimals
    const amountBn = parseUnits(amount, tokenMetadata.decimals);
    if (amountBn <= 0n) return toResult('Amount must be greater than 0', true);

    await notify(`Preparing to submit ${amount} ${tokenMetadata.symbol} as bribe...`);

    const transactions: TransactionParams[] = [];

    // Check and prepare approve transaction if needed
    await checkToApprove({
        args: {
            account,
            target: tokenAddress,
            spender: bribeAddress,
            amount: amountBn,
        },
        provider,
        transactions,
    });

    const bribeTx: TransactionParams = {
        target: bribeAddress,
        data: encodeFunctionData({
            abi: bribeAbi,
            functionName: 'notifyRewardAmount',
            args: [tokenAddress, amountBn],
        }),
    };
    transactions.push(bribeTx);

    await notify('Waiting for transaction confirmation...');

    const result = await sendTransactions({ chainId, account, transactions });
    const bribeMessage = result.data[result.data.length - 1];

    return toResult(
        result.isMultisig 
            ? bribeMessage.message 
            : `Successfully submitted ${amount} ${tokenMetadata.symbol} as bribe. ${bribeMessage.message}`
    );
}

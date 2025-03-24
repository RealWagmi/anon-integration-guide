import { Address, encodeFunctionData } from 'viem';
import { FunctionReturn, FunctionOptions, TransactionParams, toResult, getChainFromName } from '@heyanon/sdk';
import { SUPER_VOTER_ADDRESS, supportedChains } from '../constants';
import { superVoterAbi } from '../abis/superVoterAbi';

interface Props {
    chainName: string;
    account: Address;
    nftIds: string[];
}

/**
 * Maximizes the lock duration for multiple NFTs
 * @param props - The max lock parameters
 * @param options - System tools for blockchain interactions
 * @returns Transaction result
 */
export async function maxLockMultiple({ chainName, account, nftIds }: Props, { sendTransactions, notify }: FunctionOptions): Promise<FunctionReturn> {
    // Check wallet connection
    if (!account) return toResult('Wallet not connected', true);

    // Validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Equalizer is not supported on ${chainName}`, true);

    // Validate NFT IDs
    if (!nftIds.length) return toResult('At least one NFT ID is required', true);

    const nftIdsBn = nftIds.map((id) => BigInt(id));

    await notify('Preparing to maximize lock duration for multiple NFTs...');

    const transactions: TransactionParams[] = [];

    const maxLockTx: TransactionParams = {
        target: SUPER_VOTER_ADDRESS,
        data: encodeFunctionData({
            abi: superVoterAbi,
            functionName: 'maxLockMultiple',
            args: [nftIdsBn],
        }),
    };
    transactions.push(maxLockTx);

    await notify('Waiting for transaction confirmation...');

    const result = await sendTransactions({ chainId, account, transactions });
    const maxLockMessage = result.data[result.data.length - 1];

    return toResult(result.isMultisig ? maxLockMessage.message : `Successfully maximized lock duration for multiple NFTs. ${maxLockMessage.message}`);
}

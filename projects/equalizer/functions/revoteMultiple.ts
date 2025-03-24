import { Address, encodeFunctionData } from 'viem';
import { FunctionReturn, FunctionOptions, TransactionParams, toResult, getChainFromName } from '@heyanon/sdk';
import { SUPER_VOTER_ADDRESS, supportedChains } from '../constants';
import { superVoterAbi } from '../abis/superVoterAbi';

interface Props {
    chainName: string;
    account: Address;
    nftIds: string[];
    maxLock: boolean;
}

export async function revoteMultiple({ chainName, account, nftIds, maxLock }: Props, { sendTransactions, notify }: FunctionOptions): Promise<FunctionReturn> {
    if (!account) return toResult('Wallet not connected', true);

    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Equalizer is not supported on ${chainName}`, true);

    if (!nftIds.length) return toResult('At least one NFT ID is required', true);

    const nftIdsBn = nftIds.map((id) => BigInt(id));

    await notify('Preparing to revote multiple positions...');

    const transactions: TransactionParams[] = [];

    const revoteTx: TransactionParams = {
        target: SUPER_VOTER_ADDRESS,
        data: encodeFunctionData({
            abi: superVoterAbi,
            functionName: 'revoteMultiple',
            args: [maxLock, nftIdsBn],
        }),
    };
    transactions.push(revoteTx);

    await notify('Waiting for transaction confirmation...');

    const result = await sendTransactions({ chainId, account, transactions });
    const revoteMessage = result.data[result.data.length - 1];

    return toResult(result.isMultisig ? revoteMessage.message : `Successfully revoted multiple positions. ${revoteMessage.message}`);
}

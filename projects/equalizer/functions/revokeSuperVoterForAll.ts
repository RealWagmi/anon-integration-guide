import { Address, encodeFunctionData } from 'viem';
import { FunctionReturn, FunctionOptions, TransactionParams, toResult, getChainFromName } from '@heyanon/sdk';
import { SUPER_VOTER_ADDRESS, supportedChains, VE_EQUAL_ADDRESS } from '../constants';
import { veNftAbi } from '../abis/veNftAbi';

interface Props {
    chainName: string;
    account: Address;
}

export async function revokeSuperVoterForAll({ chainName, account }: Props, { sendTransactions, notify }: FunctionOptions): Promise<FunctionReturn> {
    if (!account) return toResult('Wallet not connected', true);

    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Equalizer is not supported on ${chainName}`, true);

    await notify('Preparing to revoke Super Voter approval...');

    const transactions: TransactionParams[] = [];

    const revokeTx: TransactionParams = {
        target: VE_EQUAL_ADDRESS,
        data: encodeFunctionData({
            abi: veNftAbi,
            functionName: 'setApprovalForAll',
            args: [SUPER_VOTER_ADDRESS, false],
        }),
    };
    transactions.push(revokeTx);

    await notify('Waiting for transaction confirmation...');

    const result = await sendTransactions({ chainId, account, transactions });
    const revokeMessage = result.data[result.data.length - 1];

    return toResult(result.isMultisig ? revokeMessage.message : `Successfully revoked Super Voter approval. ${revokeMessage.message}`);
}

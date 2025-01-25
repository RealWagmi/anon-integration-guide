import { Address, encodeFunctionData } from 'viem';
import { FunctionReturn, FunctionOptions, TransactionParams, toResult, getChainFromName } from '@heyanon/sdk';
import { supportedChains } from '../constants';
import { veNftAbi } from '../abis/veNftAbi';

interface Props {
    chainName: string;
    account: Address;
    vestedAddress: Address;
    superVoterAddress: Address;
}

export async function revokeSuperVoterForAll(
    { chainName, account, vestedAddress, superVoterAddress }: Props,
    { sendTransactions, notify }: FunctionOptions
): Promise<FunctionReturn> {
    if (!account) return toResult('Wallet not connected', true);

    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Equalizer is not supported on ${chainName}`, true);

    if (!vestedAddress) return toResult('Vested address is required', true);
    if (!superVoterAddress) return toResult('Super Voter address is required', true);

    await notify('Preparing to revoke Super Voter approval...');

    const transactions: TransactionParams[] = [];

    const revokeTx: TransactionParams = {
        target: vestedAddress,
        data: encodeFunctionData({
            abi: veNftAbi,
            functionName: 'setApprovalForAll',
            args: [superVoterAddress, false],
        }),
    };
    transactions.push(revokeTx);

    await notify('Waiting for transaction confirmation...');

    const result = await sendTransactions({ chainId, account, transactions });
    const revokeMessage = result.data[result.data.length - 1];

    return toResult(result.isMultisig ? revokeMessage.message : `Successfully revoked Super Voter approval. ${revokeMessage.message}`);
}

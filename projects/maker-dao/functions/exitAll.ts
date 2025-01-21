import { Address, encodeFunctionData, parseUnits } from 'viem';
import { FunctionReturn, FunctionOptions, TransactionParams, toResult, getChainFromName, checkToApprove } from '@heyanon/sdk';
import { supportedChains, DSR_ADDRESS, STR_ADDRESS, DAI_ADDRESS } from '../constants';
import dsrManagerAbi from '../abis/DsrManager.abi.json';

interface Props {
    chainName: string;
    account: Address;
    destination: Address
}

export async function exitAll({ chainName, account, destination }: Props, { sendTransactions, notify, getProvider }: FunctionOptions): Promise<FunctionReturn> {
    if (!account) return toResult('Wallet not connected', true);

    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Sky protocol is not supported on ${chainName}`, true);

    await notify('Preparing to withdraw DAI from all pots...');

    const transactions: TransactionParams[] = [];

    // Prepare exit transaction
    const tx: TransactionParams = {
        target: DSR_ADDRESS,
        data: encodeFunctionData({
            abi: dsrManagerAbi,
            functionName: 'exitAll',
            args: [destination],
        }),
    };

    transactions.push(tx);

    await notify('Waiting for transaction confirmation...');

    const result = await sendTransactions({ chainId, account, transactions });
    const exitAllMessage = result.data[result.data.length - 1];

    return toResult(result.isMultisig ? exitAllMessage.message : `Successfully exited DAI from all pots. ${exitAllMessage.message}`);
}
import { Address, encodeFunctionData, parseUnits } from 'viem';
import { FunctionReturn, FunctionOptions, TransactionParams, toResult, getChainFromName, checkToApprove } from '@heyanon/sdk';
import { supportedChains, DSR_ADDRESS, STR_ADDRESS, DAI_ADDRESS } from '../constants';
import dsrManagerAbi from '../abis/DsrManager.abi.json';

interface Props {
    chainName: string;
    account: Address;
    destination: Address
    amount: string;
}

export async function exit({ chainName, account, destination, amount }: Props, { sendTransactions, notify, getProvider }: FunctionOptions): Promise<FunctionReturn> {
    if (!account) return toResult('Wallet not connected', true);

    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Sky protocol is not supported on ${chainName}`, true);

    await notify('Preparing to withdraw DAI from pot...');

    const amountInWei = parseUnits(amount, 18);
    if (amountInWei === 0n) return toResult('Amount must be greater than 0', true);

    const transactions: TransactionParams[] = [];

    // Prepare exit transaction
    const tx: TransactionParams = {
        target: DSR_ADDRESS,
        data: encodeFunctionData({
            abi: dsrManagerAbi,
            functionName: 'exit',
            args: [destination, amountInWei],
        }),
    };

    transactions.push(tx);

    await notify('Waiting for transaction confirmation...');

    const result = await sendTransactions({ chainId, account, transactions });
    const exitMessage = result.data[result.data.length - 1];

    return toResult(result.isMultisig ? exitMessage.message : `Successfully exited DAI from pot. ${exitMessage.message}`);
}
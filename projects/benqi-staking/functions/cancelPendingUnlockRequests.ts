import { FunctionOptions, FunctionReturn, toResult, TransactionParams } from '@heyanon/sdk';
import { Address, encodeFunctionData } from 'viem';
import sAvaxAbi from '../abis/sAvax';
import { SAVAX_ADDRESS } from '../constants';
import { parseWallet } from '../utils';

type Props = {
    chainName: string;
    account: Address;
};

/**
 * Cancel pending unlock requests in the sAVAX contract
 * @param props - The function `Props`
 * @param tools - System tools for blockchain interactions
 * @returns Transaction result
 */
export async function cancelPendingUnlockRequests(props: Props, { sendTransactions, notify }: FunctionOptions): Promise<FunctionReturn> {
    const wallet = parseWallet(props);

    if (!wallet.success) {
        return toResult(wallet.errorMessage, true);
    }

    const { account, chainId } = wallet.data;

    const transactions: TransactionParams[] = [];

    await notify('Preparing cancelPendingUnlockRequests transaction...');

    const tx: TransactionParams = {
        target: SAVAX_ADDRESS,
        data: encodeFunctionData({
            abi: sAvaxAbi,
            functionName: 'cancelPendingUnlockRequests',
            args: [],
        }),
    };

    transactions.push(tx);

    await notify('Waiting for transaction confirmation...');

    // Sign and send transaction
    const result = await sendTransactions({ chainId, account, transactions });
    const message = result.data[result.data.length - 1];

    return toResult(result.isMultisig ? message.message : `Successfully Canceled pending unlock requests. ${message.message}`);
}

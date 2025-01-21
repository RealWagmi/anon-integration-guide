import { FunctionOptions, FunctionReturn, toResult, TransactionParams } from '@heyanon/sdk';
import { Address, encodeFunctionData } from 'viem';
import veQiAbi from '../abis/veQi';
import { QI_DECIMALS, VE_QI_ADDRESS } from '../constants';
import { parseAmount, parseWallet } from '../utils';

type Props = {
    chainName: string;
    account: Address;
    amount: string;
};

/**
 * Unstakes specified amount of Qi on the veQi contract
 * @param props - The function `Props`
 * @param tools - System tools for blockchain interactions
 * @returns Transaction result
 */
export async function unstakeQi(props: Props, { sendTransactions, notify }: FunctionOptions): Promise<FunctionReturn> {
    const wallet = parseWallet(props);

    if (!wallet.success) {
        return toResult(wallet.errorMessage, true);
    }

    const { account, chainId } = wallet.data;

    const amount = parseAmount({ ...props, decimals: QI_DECIMALS });

    if (!amount.success) {
        return toResult(amount.errorMessage, true);
    }

    const transactions: TransactionParams[] = [];

    await notify('Preparing withdraw Qi transaction...');

    const tx: TransactionParams = {
        target: VE_QI_ADDRESS,
        data: encodeFunctionData({
            abi: veQiAbi,
            functionName: 'withdraw',
            args: [amount.data],
        }),
    };

    transactions.push(tx);

    await notify('Waiting for transaction confirmation...');

    // Sign and send transaction
    const result = await sendTransactions({ chainId, account, transactions });
    const message = result.data[result.data.length - 1];

    return toResult(result.isMultisig ? message.message : `Successfully unstaked ${props.amount} tokens. ${message.message}`);
}

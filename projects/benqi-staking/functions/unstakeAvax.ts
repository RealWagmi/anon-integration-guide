import { FunctionOptions, FunctionReturn, toResult, TransactionParams } from '@heyanon/sdk';
import { Address, encodeFunctionData } from 'viem';
import sAvaxAbi from '../abis/sAvax';
import { AVAX_DECIMALS, SAVAX_ADDRESS } from '../constants';
import { parseAmount, parseWallet } from '../utils';

type Props = {
    chainName: string;
    account: Address;
    amount: string;
};

/**
 * Unstakes specified amount of AVAX from the sAVAX contract
 * @param props - The function `Props`
 * @param tools - System tools for blockchain interactions
 * @returns Transaction result
 */
export async function unstakeAvax(props: Props, { sendTransactions, notify }: FunctionOptions): Promise<FunctionReturn> {
    const wallet = parseWallet(props);

    if (!wallet.success) {
        return toResult(wallet.errorMessage, true);
    }

    const { account, chainId } = wallet.data;

    const amount = parseAmount({ ...props, decimals: AVAX_DECIMALS });

    if (!amount.success) {
        return toResult(amount.errorMessage, true);
    }

    const transactions: TransactionParams[] = [];

    await notify('Preparing requestUnlock AVAX transaction...');

    const tx: TransactionParams = {
        target: SAVAX_ADDRESS,
        data: encodeFunctionData({
            abi: sAvaxAbi,
            functionName: 'requestUnlock',
            args: [amount.data],
        }),
    };

    transactions.push(tx);

    await notify('Waiting for transaction confirmation...');

    // Sign and send transaction
    const result = await sendTransactions({ chainId, account, transactions });
    const message = result.data[result.data.length - 1];

    return toResult(result.isMultisig ? message.message : `Successfully requested unstake for ${props.amount} tokens. ${message.message}`);
}

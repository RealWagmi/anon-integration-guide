import { checkToApprove, FunctionOptions, FunctionReturn, toResult, TransactionParams } from '@heyanon/sdk';
import { Address, encodeFunctionData } from 'viem';
import veQiAbi from '../abis/veQi';
import { QI_ADDRESS, QI_DECIMALS, VE_QI_ADDRESS } from '../constants';
import { parseAmount, parseWallet } from '../utils';

type Props = {
    chainName: string;
    account: Address;
    amount: string;
};

/**
 * Stakes specified amount of Qi on the veQi contract
 * @param props - The function {@link Props}
 * @param tools - System tools for blockchain interactions
 * @returns Transaction result
 */
export async function stakeQi(props: Props, { sendTransactions, notify, getProvider }: FunctionOptions): Promise<FunctionReturn> {
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
    const provider = getProvider(chainId);

    await notify('Checking Qi allowance...');

    await checkToApprove({
        args: {
            account,
            target: QI_ADDRESS,
            spender: VE_QI_ADDRESS,
            amount: amount.data,
        },
        provider,
        transactions,
    });

    await notify('Preparing stake Qi transaction...');

    const tx: TransactionParams = {
        target: VE_QI_ADDRESS,
        data: encodeFunctionData({
            abi: veQiAbi,
            functionName: 'deposit',
            args: [amount.data],
        }),
    };

    transactions.push(tx);

    await notify('Waiting for transaction confirmation...');

    // Sign and send transaction
    const result = await sendTransactions({ chainId, account, transactions });
    const message = result.data[result.data.length - 1];

    return toResult(result.isMultisig ? message.message : `Successfully staked ${props.amount} tokens. ${message.message}`);
}

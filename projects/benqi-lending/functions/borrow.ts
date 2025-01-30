import { FunctionOptions, FunctionReturn, toResult, TransactionParams } from '@heyanon/sdk';
import { Address, encodeFunctionData } from 'viem';
import qiAvaxAbi from '../abis/qiAvax';
import qiERC20Abi from '../abis/qiERC20';
import { MarketProps } from '../constants';
import { isERC20Based, parseAmount, parseMarket, parseWallet } from '../utils';

type Props = MarketProps & {
    chainName: string;
    account: Address;
    amount: string;
};

/**
 * Borrows specified amount of tokens against previously set collateral
 * @param props - The function {@link Props}
 * @param tools - System tools for blockchain interactions
 * @returns Transaction result
 */
export async function borrow(props: Props, { sendTransactions, notify }: FunctionOptions): Promise<FunctionReturn> {
    const wallet = parseWallet(props);

    if (!wallet.success) {
        return toResult(wallet.errorMessage, true);
    }

    const { account, chainId } = wallet.data;

    const amount = parseAmount(props);

    if (!amount.success) {
        return toResult(amount.errorMessage, true);
    }

    const market = parseMarket(props);

    if (!market.success) {
        return toResult(market.errorMessage, true);
    }

    const transactions: TransactionParams[] = [];

    await notify('Preparing borrow transaction...');

    const tx: TransactionParams = {
        target: market.data.marketAddress,
        data: encodeFunctionData({
            abi: isERC20Based(market.data) ? qiERC20Abi : qiAvaxAbi,
            functionName: 'borrow',
            args: [amount.data],
        }),
    };

    transactions.push(tx);

    await notify('Waiting for transaction confirmation...');

    // Sign and send transaction
    const result = await sendTransactions({ chainId, account, transactions });
    const message = result.data[result.data.length - 1];

    return toResult(result.isMultisig ? message.message : `Successfully borrowed ${props.amount} tokens. ${message.message}`);
}

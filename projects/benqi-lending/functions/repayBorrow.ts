import { checkToApprove, FunctionOptions, FunctionReturn, toResult, TransactionParams } from '@heyanon/sdk';
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
 * Repays a borrowed amount on the specified market.
 * @param props - The function `Props`
 * @param tools - System tools for blockchain interactions
 * @returns Transaction result
 */
export async function repayBorrow(props: Props, { sendTransactions, notify, getProvider }: FunctionOptions): Promise<FunctionReturn> {
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

    if (isERC20Based(market.data)) {
        // Underlying asset
        const provider = getProvider(chainId);

        await notify('Checking underlying contract address...');

        const underlyingAssetAddress = await provider.readContract({
            abi: qiERC20Abi,
            address: market.data.marketAddress,
            functionName: 'underlying',
            args: [],
        });

        await notify('Checking underlying contract allowance...');

        await checkToApprove({
            args: {
                account,
                target: underlyingAssetAddress,
                spender: market.data.marketAddress,
                amount: amount.data,
            },
            provider,
            transactions,
        });

        await notify('Preparing repayBorrow transaction...');

        const tx: TransactionParams = {
            target: market.data.marketAddress,
            data: encodeFunctionData({
                abi: qiERC20Abi,
                functionName: 'repayBorrow',
                args: [amount.data],
            }),
        };

        transactions.push(tx);
    } else {
        await notify('Preparing repayBorrow transaction...');

        const tx: TransactionParams = {
            target: market.data.marketAddress,
            data: encodeFunctionData({
                abi: qiAvaxAbi,
                functionName: 'repayBorrow',
                args: [],
            }),
            value: amount.data,
        };

        transactions.push(tx);
    }

    await notify('Waiting for transaction confirmation...');

    // Sign and send transaction
    const result = await sendTransactions({ chainId, account, transactions });
    const message = result.data[result.data.length - 1];

    return toResult(result.isMultisig ? message.message : `Successfully repaid borrow of ${amount.data} tokens. ${message.message}`);
}

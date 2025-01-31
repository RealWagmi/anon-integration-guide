import { FunctionOptions, FunctionReturn, toResult, TransactionParams } from '@heyanon/sdk';
import { Address, encodeFunctionData, erc20Abi } from 'viem';
import qiAvaxAbi from '../abis/qiAvax';
import qiERC20Abi from '../abis/qiERC20';
import { AVAX_DECIMALS, MarketProps } from '../constants';
import { isERC20Based, parseAmount, parseMarket, parseWallet } from '../utils/parse';

type Props = MarketProps & {
    chainName: string;
    account: Address;
    amount: string;
};

/**
 * Withdraws a specified amount of tokens from the protocol.
 * @param props - The function {@link Props}
 * @param tools - System tools for blockchain interactions
 * @returns Transaction result
 */
export async function withdrawCollateral(props: Props, { sendTransactions, notify, getProvider }: FunctionOptions): Promise<FunctionReturn> {
    const wallet = parseWallet(props);

    if (!wallet.success) {
        return toResult(wallet.errorMessage, true);
    }

    const { account, chainId } = wallet.data;

    const market = parseMarket(props);

    if (!market.success) {
        return toResult(market.errorMessage, true);
    }

    const provider = getProvider(chainId);
    const transactions: TransactionParams[] = [];

    if (isERC20Based(market.data)) {
        await notify('Checking underlying contract address...');

        const underlyingAssetAddress = await provider.readContract({
            abi: qiERC20Abi,
            address: market.data.marketAddress,
            functionName: 'underlying',
            args: [],
        });

        const underlyingDecimals = await provider.readContract({
            abi: erc20Abi,
            address: underlyingAssetAddress,
            functionName: 'decimals',
            args: [],
        });

        const amount = parseAmount({
            amount: props.amount,
            decimals: underlyingDecimals,
        });

        if (!amount.success) {
            return toResult(amount.errorMessage, true);
        }

        await notify('Preparing redeemUnderlying transaction...');

        const tx: TransactionParams = {
            target: market.data.marketAddress,
            data: encodeFunctionData({
                abi: qiERC20Abi,
                functionName: 'redeemUnderlying',
                args: [amount.data],
            }),
        };

        transactions.push(tx);
    } else {
        const amount = parseAmount({
            amount: props.amount,
            decimals: AVAX_DECIMALS,
        });

        if (!amount.success) {
            return toResult(amount.errorMessage, true);
        }

        await notify('Preparing redeemUnderlying transaction...');

        const tx: TransactionParams = {
            target: market.data.marketAddress,
            data: encodeFunctionData({
                abi: qiAvaxAbi,
                functionName: 'redeemUnderlying',
                args: [amount.data],
            }),
        };

        transactions.push(tx);
    }

    await notify('Waiting for transaction confirmation...');

    // Sign and send transaction
    const result = await sendTransactions({ chainId, account, transactions });
    const message = result.data[result.data.length - 1];

    return toResult(result.isMultisig ? message.message : `Successfully withdrawn collateral of ${props.amount} tokens. ${message.message}`);
}

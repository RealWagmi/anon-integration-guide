import { checkToApprove, FunctionOptions, FunctionReturn, toResult, TransactionParams } from '@heyanon/sdk';
import { Address, encodeFunctionData, erc20Abi } from 'viem';
import qiAvaxAbi from '../abis/qiAvax';
import qiERC20Abi from '../abis/qiERC20';
import { AVAX_DECIMALS, MarketProps } from '../constants';
import { checkBalance } from '../utils/checkBalance';
import { checkERC20Balance } from '../utils/checkERC20Balance';
import { isERC20Based, parseAmount, parseMarket, parseWallet } from '../utils/parse';

type Props = MarketProps & {
    chainName: string;
    account: Address;
    amount: string;
};

/**
 * Deposits a specified amount of tokens into the protocol. Necessary first step for borrowing.
 * @param props - The function {@link Props}
 * @param tools - System tools for blockchain interactions
 * @returns Transaction result
 */
export async function depositCollateral(props: Props, { sendTransactions, notify, getProvider }: FunctionOptions): Promise<FunctionReturn> {
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

        // Parsing amount

        const amount = parseAmount({
            amount: props.amount,
            decimals: underlyingDecimals,
        });

        if (!amount.success) {
            return toResult(amount.errorMessage, true);
        }

        try {
            await notify(`Verifying underlying asset balance...`);

            await checkERC20Balance({
                args: {
                    token: underlyingAssetAddress,
                    account,
                    amount: amount.data,
                    decimals: underlyingDecimals,
                },
                provider,
            });
        } catch (error: unknown) {
            if (error instanceof Error) {
                return toResult(error.message, true);
            }

            return toResult('Unknown error', true);
        }

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

        await notify('Preparing mint transaction...');

        const tx: TransactionParams = {
            target: market.data.marketAddress,
            data: encodeFunctionData({
                abi: qiERC20Abi,
                functionName: 'mint',
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

        try {
            await notify('Verifying account balance...');

            await checkBalance({
                args: {
                    account,
                    amount: amount.data,
                    decimals: AVAX_DECIMALS,
                },
                provider,
            });
        } catch (error: unknown) {
            if (error instanceof Error) {
                return toResult(error.message, true);
            }

            return toResult('Unknown error', true);
        }

        await notify('Preparing mint transaction...');

        const tx: TransactionParams = {
            target: market.data.marketAddress,
            data: encodeFunctionData({
                abi: qiAvaxAbi,
                functionName: 'mint',
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

    return toResult(result.isMultisig ? message.message : `Successfully deposited collateral of ${props.amount} tokens. ${message.message}`);
}

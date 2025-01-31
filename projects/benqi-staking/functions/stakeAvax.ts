import { FunctionOptions, FunctionReturn, toResult, TransactionParams } from '@heyanon/sdk';
import { Address, encodeFunctionData } from 'viem';
import sAvaxAbi from '../abis/sAvax';
import { AVAX_DECIMALS, SAVAX_ADDRESS } from '../constants';
import { checkBalance } from '../utils/checkBalance';
import { parseAmount, parseWallet } from '../utils/parse';

type Props = {
    chainName: string;
    account: Address;
    amount: string;
};

/**
 * Stakes specified amount of AVAX on the sAVAX contract
 * @param props - The function {@link Props}
 * @param tools - System tools for blockchain interactions
 * @returns Transaction result
 */
export async function stakeAvax(props: Props, { sendTransactions, notify, getProvider }: FunctionOptions): Promise<FunctionReturn> {
    const wallet = parseWallet(props);

    if (!wallet.success) {
        return toResult(wallet.errorMessage, true);
    }

    const { account, chainId } = wallet.data;

    const amount = parseAmount({ ...props, decimals: AVAX_DECIMALS });

    if (!amount.success) {
        return toResult(amount.errorMessage, true);
    }

    const provider = getProvider(chainId);
    const transactions: TransactionParams[] = [];

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

    await notify('Preparing stake AVAX transaction...');

    const tx: TransactionParams = {
        target: SAVAX_ADDRESS,
        data: encodeFunctionData({
            abi: sAvaxAbi,
            functionName: 'submit',
            args: [],
        }),
        value: amount.data,
    };

    transactions.push(tx);

    await notify('Waiting for transaction confirmation...');

    // Sign and send transaction
    const result = await sendTransactions({ chainId, account, transactions });
    const message = result.data[result.data.length - 1];

    return toResult(result.isMultisig ? message.message : `Successfully staked ${props.amount} tokens. ${message.message}`);
}

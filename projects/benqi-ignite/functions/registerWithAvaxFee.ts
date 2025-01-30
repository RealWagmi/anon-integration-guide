import { FunctionOptions, FunctionReturn, toResult, TransactionParams } from '@heyanon/sdk';
import { Address, encodeFunctionData } from 'viem';
import igniteAbi from '../abis/ignite';
import { AVAX_DECIMALS, AVAX_REGISTRATION_FEE, IGNITE_ADDRESS, RegisterProps, VALIDATION_DURATION_TIME } from '../constants';
import { checkBalance } from '../utils/checkBalance';
import { parseRegister, parseWallet } from '../utils/parse';

type Props = RegisterProps & {
    chainName: string;
    account: Address;
};

/**
 * Register nodeId with AVAX.
 * @param props - The function {@link Props}
 * @param tools - System tools for blockchain interactions
 * @returns Transaction result
 */
export async function registerWithAvaxFee(props: Props, { sendTransactions, notify, getProvider }: FunctionOptions): Promise<FunctionReturn> {
    const wallet = parseWallet(props);

    if (!wallet.success) {
        return toResult(wallet.errorMessage, true);
    }

    const { account, chainId } = wallet.data;

    const register = parseRegister(props);

    if (!register.success) {
        return toResult(register.errorMessage, true);
    }

    const provider = getProvider(chainId);
    const fee = AVAX_REGISTRATION_FEE[register.data.validationDuration];

    try {
        await notify('Verifying account balance...');

        await checkBalance({
            args: {
                account,
                amount: fee,
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

    const time = VALIDATION_DURATION_TIME[register.data.validationDuration];

    const transactions: TransactionParams[] = [];

    await notify('Preparing registerWithAvaxFee transaction...');

    const tx: TransactionParams = {
        target: IGNITE_ADDRESS,
        data: encodeFunctionData({
            abi: igniteAbi,
            functionName: 'registerWithAvaxFee',
            args: [register.data.nodeId, register.data.blsProofOfPossession, time],
        }),
        value: fee,
    };

    transactions.push(tx);

    await notify('Waiting for transaction confirmation...');

    // Sign and send transaction
    const result = await sendTransactions({ chainId, account, transactions });
    const message = result.data[result.data.length - 1];

    return toResult(result.isMultisig ? message.message : `Successfully registered node ${register.data.nodeId} with AVAX token. ${message.message}`);
}

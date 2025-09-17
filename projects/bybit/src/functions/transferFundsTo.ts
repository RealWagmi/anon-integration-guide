import { FunctionReturn, toResult } from '@heyanon/sdk';
import { FunctionOptionsWithExchange } from '../overrides';
import { transfer as transferFundsHelper } from '../helpers/account';

interface Props {
    currency: string;
    amount: number;
    destinationAccount: string;
}

/**
 * Transfer funds to the funding account or the unified trading account (UTA).
 *
 * @param props - The function input parameters
 * @param props.currency - The currency to transfer
 * @param props.amount - The amount to transfer
 * @param props.destinationAccount - The account to transfer to
 * @param options HeyAnon SDK options
 * @returns A message with the result of the operation
 */
export async function transferFundsTo({ currency, amount, destinationAccount }: Props, { exchange }: FunctionOptionsWithExchange): Promise<FunctionReturn> {
    try {
        // Parse destination account type
        let ccxtDestination: 'funding' | 'unified';
        let destinationAccountLabel = '';
        switch (destinationAccount) {
            case 'funding':
                ccxtDestination = 'funding';
                destinationAccountLabel = 'funding account';
                break;
            case 'trading':
                ccxtDestination = 'unified';
                destinationAccountLabel = 'unified trading account (UTA)';
                break;
            default:
                return toResult(`Invalid destination account, must be either "funding" or "trading"`, true);
        }
        // Infer the source account from the destination account
        const ccxtSource = ccxtDestination === 'funding' ? 'unified' : 'funding';
        const transfer = await transferFundsHelper(exchange, { currency, amount, from: ccxtSource, to: ccxtDestination });
        return toResult(`Created transfer request with ID ${transfer.id} to ${destinationAccountLabel}`);
    } catch (error) {
        console.error(error);
        return toResult(`Error transferring funds to '${destinationAccount}': ${error}`, true);
    }
}

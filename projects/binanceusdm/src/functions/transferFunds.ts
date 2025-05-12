import { FunctionReturn, toResult } from '@heyanon/sdk';
import { FunctionOptionsWithExchange } from '../overrides';
import { transfer as transferFundsHelper } from '../helpers/account';

interface Props {
    currency: string;
    amount: number;
    from?: string | null;
    to: string;
}

/**
 * Transfer funds between accounts of the same user, e.g. from spot to future account
 *
 * @param {Object} props - The function input parameters
 * @param {string} props.currency - The currency to transfer
 * @param {number} props.amount - The amount to transfer
 * @param {string|null} [props.from] - The account to transfer from, defaults to 'spot' or 'future' depending on the value of 'to'.
 * @param {string} props.to - The account to transfer to
 */
export async function transferFunds({ currency, amount, from, to }: Props, { exchange }: FunctionOptionsWithExchange): Promise<FunctionReturn> {
    try {
        if (!from && !to) {
            return toResult(`Error: Cannot determine details of desired transfer`, true);
        }
        if (!from) {
            from = to === 'spot' ? 'future' : 'spot';
        }
        const transfer = await transferFundsHelper(exchange, { currency, amount, from, to });
        return toResult(`Created transfer request with ID ${transfer.id}`);
    } catch (error) {
        return toResult(`Error transferring funds from '${from}' to '${to}': ${error}`, true);
    }
}

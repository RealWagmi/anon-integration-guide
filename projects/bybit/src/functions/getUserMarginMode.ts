import { FunctionReturn, toResult } from '@heyanon/sdk';
import { FunctionOptionsWithExchange } from '../overrides';
import { getAccountMarginMode } from '../helpers/exchange';

interface Props {}

/**
 * Get the user configured margin mode (set at the account level).
 *
 * @param {Object} props - The function input parameters
 * @param {FunctionOptions} options HeyAnon SDK options
 * @returns {Promise<FunctionReturn>} A message with the result of the operation
 */
export async function getUserMarginMode({}: Props, { exchange }: FunctionOptionsWithExchange): Promise<FunctionReturn> {
    try {
        const marginMode = await getAccountMarginMode(exchange);
        return toResult(`The margin mode for your account is ${marginMode} margin`);
    } catch (error) {
        return toResult(`Error getting margin mode: ${error}`, true);
    }
}

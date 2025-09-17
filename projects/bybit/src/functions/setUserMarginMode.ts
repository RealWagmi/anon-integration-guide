import { FunctionReturn, toResult } from '@heyanon/sdk';
import { FunctionOptionsWithExchange } from '../overrides';
import { setUserMarginModeAtAccountLevel } from '../helpers/leverage';
import { MARGIN_MODES } from '../constants';
import { getAccountMarginMode } from '../helpers/exchange';

interface Props {
    marginMode: (typeof MARGIN_MODES)[number];
}

/**
 * Set the account-level margin mode for the user
 *
 * @param props - The function input parameters
 * @param props.marginMode - The margin mode to set, one of: cross, isolated, portfolio
 * @param options HeyAnon SDK options
 * @returns A message with the result of the operation
 */
export async function setUserMarginMode({ marginMode }: Props, { exchange, notify }: FunctionOptionsWithExchange): Promise<FunctionReturn> {
    try {
        const currentMarginMode = await getAccountMarginMode(exchange);
        if (currentMarginMode !== marginMode) {
            notify(`Setting margin mode to ${marginMode}, all your open positions will be affected`);
            await setUserMarginModeAtAccountLevel(exchange, marginMode);
            return toResult(`Successfully set margin mode to ${marginMode} margin`);
        } else {
            return toResult(`Margin mode is already set to ${marginMode} margin`);
        }
    } catch (error) {
        return toResult(`Error setting margin mode: ${error}`, true);
    }
}

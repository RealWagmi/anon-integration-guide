import { FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { Address, Hex } from 'viem';
import { FeeAmount } from '../constants';
import { parseTokensAndFees, parseWallet } from '../utils/parse';
import { encodePath } from '../utils/path';

type Props = {
    account: string;
    chainName: string;
    /**
     * @description List of tokens between which you want to swap. There should be at least 2.
     * Between each consecutive tokens there should be a pool.
     */
    tokens: Address[];
    /**
     * @description List of fees between each consecutive tokens. The fees are ordered and apply
     * to each consecutive token pair fe. `fee[0]` would apply to pair of `tokens[0]` and `tokens[1]`
     */
    fees: FeeAmount[];
};

/**
 * Returns calculated amount for swap.
 * @param props - The function {@link Props}
 * @param tools - System tools for blockchain interactions
 * @returns Transaction result
 */
export async function getPath(props: Props, {}: FunctionOptions): Promise<FunctionReturn> {
    // get wallet
    const wallet = parseWallet(props);
    if (!wallet.success) {
        return toResult(wallet.errorMessage, true);
    }

    // get tokens and fees
    const tokensAndFees = parseTokensAndFees(props);
    if (!tokensAndFees.success) {
        return toResult(tokensAndFees.errorMessage, true);
    }
    const { tokens, fees } = tokensAndFees.data;

    // encode path
    let path: Hex;
    try {
        path = encodePath(tokens, fees);
    } catch (error) {
        return toResult(`Unable to encode path: ${error?.message}`, true);
    }

    // return
    return toResult(`Path for tokens ${tokens} at fees ${fees}: ${path}`);
}

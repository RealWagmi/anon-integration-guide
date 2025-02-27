import { FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { Address, erc20Abi, formatUnits, Hex } from 'viem';
import mixedQuoter from '../abis/mixedQuoter';
import { FeeAmount, MIXED_QUOTER_ADDRESS } from '../constants';
import { parseAmount, parseTokensAndFees, parseWallet } from '../utils/parse';
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
    /**
     * @description amount in of tokens to swap
     */
    amountIn: string;
};

/**
 * Returns calculated amount for swap.
 * @param props - The function {@link Props}
 * @param tools - System tools for blockchain interactions
 * @returns Transaction result
 */
export async function quoteExactInput(props: Props, { getProvider }: FunctionOptions): Promise<FunctionReturn> {
    const wallet = parseWallet(props);
    if (!wallet.success) {
        return toResult(wallet.errorMessage, true);
    }

    const tokensAndFees = parseTokensAndFees(props);
    if (!tokensAndFees.success) {
        return toResult(tokensAndFees.errorMessage, true);
    }

    const { tokens, fees } = tokensAndFees.data;
    let path: Hex;
    try {
        path = encodePath(tokens, fees);
    } catch (error) {
        return toResult(`Unable to encode path: ${error?.message}`, true);
    }

    const { chainId } = wallet.data;
    const provider = getProvider(chainId);
    const [tokenInDecimals, tokenOutDecimals, tokenOutSymbol] = await provider.multicall({
        contracts: [
            {
                abi: erc20Abi,
                address: tokens[0],
                functionName: 'decimals',
            },
            {
                abi: erc20Abi,
                address: tokens[tokens.length - 1],
                functionName: 'decimals',
            },
            {
                abi: erc20Abi,
                address: tokens[tokens.length - 1],
                functionName: 'symbol',
            },
        ],
    });
    if (tokenInDecimals.status !== 'success') return toResult(tokenInDecimals.error.message, true);
    if (tokenOutDecimals.status !== 'success') return toResult(tokenOutDecimals.error.message, true);
    if (tokenOutSymbol.status !== 'success') return toResult(tokenOutSymbol.error.message, true);

    const amount = parseAmount({
        amount: props.amountIn,
        decimals: tokenInDecimals.result,
    });
    if (!amount.success) {
        return toResult(amount.errorMessage, true);
    }

    const amountOut = await provider.simulateContract({
        abi: mixedQuoter,
        address: MIXED_QUOTER_ADDRESS,
        functionName: 'quoteExactInput',
        args: [path, amount.data],
    });

    return toResult(`After swap with provided tokens and fees you would receive: ${formatUnits(amountOut.result[0], tokenOutDecimals.result)} ${tokenOutSymbol.result}`);
}

import { FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { Address, formatUnits } from 'viem';
import mixedQuoter from "../abis/mixedQuoter";
import { MIXED_QUOTER_ADDRESS } from "../constants";

/**
 * Returns calculated amount for swaps.
 */
export async function quoteExactInput(props: Props, { getProvider }: FunctionOptions): Promise<FunctionReturn> {
    const wallet = parseWallet(props);

    if (!wallet.success) {
        return toResult(wallet.errorMessage, true);
    }

    const { chainId } = wallet.data;

    const provider = getProvider(chainId);

    const [
        amountOut,
        v3SqrtPriceX96AfterList,
        v3InitializedTicksCrossedList,
        v3SwapGasEstimate
    ] = await provider.readContract({
        abi: mixedQuoter,
        address: MIXED_QUOTER_ADDRESS,
        functionName: 'quoteExactInput',
        args: [path, amountIn],
    });

    return toResult(`Account liquidity: ${formatUnits(liquidity, LIQUIDITY_DECIMALS)} USD, Shortfall: ${formatUnits(shortfall, LIQUIDITY_DECIMALS)} USD`);
}

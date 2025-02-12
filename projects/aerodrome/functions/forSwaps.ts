import { FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { Address, formatUnits } from 'viem';
import lpSugar from "../abis/lpSugar";
import { LP_SUGAR_ADDRESS } from "../constants";
import { parseWallet } from "../utils/parse";

type Props = {
    chainName: string;
    account: Address;
    path: string,
    amount: string,
};

/**
 * Returns a compiled list of pools for swaps from pool factories.
 */
export async function forSwaps(props: Props, { getProvider }: FunctionOptions): Promise<FunctionReturn> {
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
        abi: lpSugar,
        address: LP_SUGAR_ADDRESS,
        functionName: 'forSwaps',
        args: [path, amountIn],
    });

    return toResult(`Account liquidity: ${formatUnits(liquidity, LIQUIDITY_DECIMALS)} USD, Shortfall: ${formatUnits(shortfall, LIQUIDITY_DECIMALS)} USD`);
}

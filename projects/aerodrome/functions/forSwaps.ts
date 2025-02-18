import { FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { Address } from 'viem';
import lpSugar from '../abis/lpSugar';
import { LP_SUGAR_ADDRESS } from '../constants';
import { parseWallet } from '../utils/parse';

type Props = {
    chainName: string;
    account: Address;
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

    const limit = 0;
    const offset = 0;

    const [lpDataList] = await provider.readContract({
        abi: lpSugar,
        address: LP_SUGAR_ADDRESS,
        functionName: 'forSwaps',
        args: [limit, offset],
    });

    return toResult(`LP information: ${lpDataList}`);
}

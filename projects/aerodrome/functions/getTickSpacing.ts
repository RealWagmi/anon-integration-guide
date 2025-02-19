import { FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { Address } from 'viem';
import pool from '../abis/pool';
import { parsePoolAddress, parseWallet } from '../utils/parse';

type Props = {
    chainName: string;
    account: Address;
    poolAddress: Address;
};

/**
 * Returns tick spacing for given pool address.
 */
export async function getTickSpacing(props: Props, { getProvider }: FunctionOptions): Promise<FunctionReturn> {
    const wallet = parseWallet(props);

    if (!wallet.success) {
        return toResult(wallet.errorMessage, true);
    }

    const poolData = parsePoolAddress(props);
    if (!poolData.success) {
        return toResult(poolData.errorMessage, true);
    }

    const { poolAddress } = poolData.data;

    const { chainId } = wallet.data;

    const provider = getProvider(chainId);

    const tickSpacing = await provider.readContract({
        abi: pool,
        address: poolAddress,
        functionName: 'getTickSpacing',
        args: [],
    });

    return toResult(`Tick spacing for pool address ${poolAddress}: ${tickSpacing}`);
}

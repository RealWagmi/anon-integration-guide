import { FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { Address } from 'viem';
import poolFactory from '../abis/poolFactory';
import { POOL_FACTORY_ADDRESS } from '../constants';
import { parseTokensAndFee, parseWallet } from '../utils/parse';

type Props = {
    chainName: string;
    account: Address;
    token0: Address;
    token1: Address;
    fee?: string;
};

/**
 * Returns pool address for swap from tokens and fee.
 */
export async function getPool(props: Props, { getProvider }: FunctionOptions): Promise<FunctionReturn> {
    const wallet = parseWallet(props);

    if (!wallet.success) {
        return toResult(wallet.errorMessage, true);
    }

    // default to V3_LOW
    const tokensAndFee = parseTokensAndFee(props);
    if (!tokensAndFee.success) {
        return toResult(tokensAndFee.errorMessage, true);
    }

    const { token0, token1, fee } = tokensAndFee.data;

    const { chainId } = wallet.data;

    const provider = getProvider(chainId);

    const poolAddress = await provider.readContract({
        abi: poolFactory,
        address: POOL_FACTORY_ADDRESS,
        functionName: 'getPool',
        args: [token0, token1, fee],
    });

    return toResult(`Found liquidity pool for pair of tokens: ${token0}:${token1} at fee ${fee}: ${poolAddress}`);
}

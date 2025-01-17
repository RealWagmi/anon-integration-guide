import { Address, formatUnits } from 'viem';
import { FunctionReturn, toResult, getChainFromName, FunctionOptions } from '@heyanon/sdk';
import { supportedChains } from '../constants';
import { guCoinAbi } from '../abis';
import { getTokenAddress } from './getTokenAddress';

interface Props {
    chainName: string;
    account: Address;
    token: Address | string;
}

/**
 * Fetch current token market cap in ETH.
 * @param props - The request parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Token market cap.
 */
export async function getTokenMarketCap({ chainName, token }: Props, { getProvider }: FunctionOptions): Promise<FunctionReturn> {
    // Validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Gu is not supported on ${chainName}`, true);

    // If token is a string, resolve it to an address
    if (typeof token === 'string') {
        const resolvedToken = await getTokenAddress({ input: token });
        if (!resolvedToken.success) return toResult(`Couldn't find token address for "${token}". Try again.`, true);
        token = resolvedToken.data.slice(2);
    }

    const publicClient = getProvider(chainId);

    const mcap = await publicClient.readContract({
        address: `0x${token}`,
        abi: guCoinAbi,
        functionName: 'reserveBalance',
        args: [],
    }) as bigint;

    return toResult(`Current Market Cap: ${formatUnits(mcap, 18)} ETH`);
}
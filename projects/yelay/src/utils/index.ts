import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { getMainnetConfig, SpoolSdk } from '@spool.fi/spool-v2-sdk';
import { config } from '../constants';

export function getChainConfig(chainId: number) {
    if (config[chainId] === undefined) {
        throw new Error(`Unsupported chain id: ${chainId}`);
    }

    return config[chainId];
}

export function getEthersProvider(chainId: number) {
    const chainConfig = getChainConfig(chainId);
    return new StaticJsonRpcProvider(chainConfig.providerUrl);
}

export function getSdk(chainId: number) {
    const chainConfig = getChainConfig(chainId);
    const rpc = getEthersProvider(chainId);
    return new SpoolSdk(getMainnetConfig(chainConfig.subGraphUrl), rpc);
}

export function wrapWithResult<T extends (...args: any[]) => any>(
    fn: T,
): (
    ...args: Parameters<T>
) => Promise<
    { success: true; result: Awaited<ReturnType<T>> } | { success: false; error: unknown }
> {
    return async (...args: Parameters<T>) => {
        try {
            const result = await fn(...args); // Works for both async and non-async functions
            return { success: true, result };
        } catch (error) {
            console.error(fn.name, error);
            return { success: false, error };
        }
    };
}

export function validateAddress(s: string): `0x${string}` {
    if (!s.startsWith('0x')) throw new Error('Invalid address');
    return s as `0x${string}`;
}

import { ChainId } from '@heyanon/sdk';
import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { getMainnetConfig, SpoolSdk } from '@spool.fi/spool-v2-sdk';
import { config } from './constants';

export function getChainConfig(chainId: ChainId) {
    if (config[chainId] === undefined) {
        throw new Error(`Unsupported chain id: ${chainId}`);
    }

    return config[chainId];
}

export function getSdk(chainId: ChainId) {
    const chainConfig = getChainConfig(chainId);
    const rpc = new StaticJsonRpcProvider(chainConfig.providerUrl);
    return new SpoolSdk(getMainnetConfig(chainConfig.subGraphUrl), rpc);
}

export function wrapWithResult<T extends (...args: any[]) => any>(
    fn: T,
): (
    ...args: Parameters<T>
) => { success: true; result: ReturnType<T> } | { success: false; error: unknown } {
    return (...args: Parameters<T>) => {
        try {
            const result = fn(...args);
            return { success: true, result };
        } catch (error) {
            return { success: false, error };
        }
    };
}

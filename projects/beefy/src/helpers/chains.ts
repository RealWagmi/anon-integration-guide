import { EVM, EvmChain } from '@heyanon/sdk';
import { PublicClient } from 'viem';
import { BEEFY_TO_ANON_CHAIN_NAMES, supportedChains } from '../constants';

/**
 * Helper function that returns the default RPC URL for a chain
 * given its provider
 */
export function getDefaultRpcUrl(provider: PublicClient): string | null {
    if (!provider.chain) return null;
    return provider.chain.rpcUrls.default.http[0];
}

/**
 * Helper function that returns the chain ID from a viem provider.
 * Throws an error if the chain ID is not found.
 */
export function getChainIdFromProvider(provider: PublicClient): number {
    if (!provider.chain) throw new Error('Could not find chain ID from provider');
    return provider.chain.id;
}

/**
 * Return true if the given Beefy chain name is supported by
 * this Anon integration.
 */
export function isBeefyChainSupported(chain: string): boolean {
    const anonChainName = BEEFY_TO_ANON_CHAIN_NAMES[chain];
    return !!anonChainName && supportedChains.includes(EVM.utils.getChainFromName(anonChainName as EvmChain));
}

/**
 * Given a Beefy chain name, return the chain ID, or
 * undefined if not supported
 */
export function getChainIdFromBeefyChainName(chain: string): number {
    if (!isBeefyChainSupported(chain)) {
        throw new Error(`Unsupported Beefy chain name: ${chain}`);
    }
    const anonChainName = BEEFY_TO_ANON_CHAIN_NAMES[chain];
    return EVM.utils.getChainFromName(anonChainName as EvmChain);
}

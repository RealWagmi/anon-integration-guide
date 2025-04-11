import { EVM, EvmChain } from '@heyanon/sdk';
import { PublicClient } from 'viem';
import { ANON_TO_BEEFY_CHAIN_NAMES, BEEFY_TO_ANON_CHAIN_NAMES, supportedChains } from '../constants';
import * as chains from 'viem/chains';

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
 * this HeyAnon integration.
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

/**
 * Given a Beefy chain name, return the corresponding HeyAnon SDK
 * chain name.
 */
export function getAnonChainNameFromBeefyChainName(chain: string): string {
    if (!isBeefyChainSupported(chain)) {
        throw new Error(`Unsupported Beefy chain name: ${chain}`);
    }
    return BEEFY_TO_ANON_CHAIN_NAMES[chain.toLowerCase()];
}

/**
 * Given a HeyAnon SDK chain name, return the corresponding Beefy
 * chain name.
 *
 * No checks are performed on whether the HeyAnon chain name is
 * supported as it is assumed each function will have already
 * checked.
 */
export function getBeefyChainNameFromAnonChainName(chain: string): string {
    return ANON_TO_BEEFY_CHAIN_NAMES[chain.toLowerCase()];
}

/**
 * Convert a HeyAnon chain name to a viem chain object; throws an error
 * if the chain is not supported by Hey Anon or viem.
 */
export function getViemChainFromAnonChainName(chainName: string): chains.Chain {
    const chainId = EVM.utils.getChainFromName(chainName as EvmChain);
    if (!chainId) {
        throw new Error(`HeyAnon does not support chain named: ${chainName}`);
    }
    if (!supportedChains.includes(chainId)) {
        throw new Error(`Beefy Finance integration does not support chain named: ${chainName}`);
    }
    const viemChain = Object.values(chains).find((viemChain) => viemChain.id === chainId);
    if (!viemChain) {
        throw new Error(`Viem does not support chain named '${chainName}'`);
    }
    return viemChain;
}

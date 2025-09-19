import { EVM, EvmChain } from '@heyanon/sdk';
import * as chains from 'viem/chains';
import { supportedChains } from '../constants';
import { toTitleCase } from './format';

const { getChainName } = EVM.utils;

/**
 * Get the chain name from the chain id
 */
export function getChainNameFromChainId(chainId: number, titleCase: boolean = true): string {
    const chainName = getChainName(chainId);
    if (!chainName) {
        throw new Error(`Chain id ${chainId} not found`);
    }
    return titleCase ? toTitleCase(chainName) : chainName;
}

/**
 * Get the chain id from the chain name
 */
export function getChainIdFromChainName(chainName: string): number {
    if (!chainName) {
        throw new Error(`Chain name '${chainName}' not supported`);
    }
    return EVM.utils.getChainFromName(chainName as EvmChain);
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
        throw new Error(`Pendle Finance integration does not support chain named: ${chainName}`);
    }
    const viemChain = Object.values(chains).find((viemChain) => viemChain.id === chainId);
    if (!viemChain) {
        throw new Error(`Viem does not support chain named '${chainName}'`);
    }
    return viemChain;
}

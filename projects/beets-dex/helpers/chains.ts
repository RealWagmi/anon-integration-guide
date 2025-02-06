import { ChainId as BalancerChainId } from '@balancer/sdk';
import { GqlChain } from './beets/types';

/**
 * Helper function that convert HeyAnon chain IDs to
 * Beets chain IDs; returns null if the chain is not supported
 */
export function anonChainNameToGqlChain(chainName: string): GqlChain | null {
    switch (chainName.toUpperCase()) {
        case 'SONIC':
            return GqlChain.Sonic;
        case 'OPTIMISM':
            return GqlChain.Optimism;
        default:
            return null;
    }
}

/**
 * Helper function that convert HeyAnon chain identifiers to
 * Balancer chain identifiers; returns null if the chain is not
 * supported
 */
export function anonChainNameToBalancerChainId(chainName: string): BalancerChainId | null {
    switch (chainName.toUpperCase()) {
        case 'SONIC':
            return BalancerChainId.SONIC;
        case 'OPTIMISM':
            return BalancerChainId.OPTIMISM;
        default:
            return null;
    }
}

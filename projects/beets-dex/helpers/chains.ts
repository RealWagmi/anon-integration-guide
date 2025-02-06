import { GqlChain } from "./beets/types";

/**
 * Helper function that convert HeyAnon chain identifiers to
 * Beets chain identifiers
 */
export function anonChainNameToGqlChain(chainName: string): GqlChain {
    switch (chainName.toUpperCase()) {
        case "SONIC": return GqlChain.Sonic;
        case "OPTIMISM": return GqlChain.Optimism;
        default: throw new Error(`Unsupported chain: ${chainName}`);
    }
}


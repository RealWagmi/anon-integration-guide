// constants.ts
import { ChainId } from "@heyanon/sdk";

export const supportedChains = [ChainId.BASE];

export const ADDRESSES = {
    // Core Protocol Contracts
    VAULT: '0x95Fa1ddc9a78273f795e67AbE8f1Cd2Cd39831fF' as `0x${string}`,
    LEVERAGE_MODULE: '0xdB0Cd65dcc7fE07003cE1201f91E1F966fA95768' as `0x${string}`,
    STABLE_MODULE: '0xb95fB324b8A2fAF8ec4f76e3dF46C718402736e2' as `0x${string}`,
    DELAYED_ORDER: '0x6D857e9D24a7566bB72a3FB0847A3E0e4E1c2879' as `0x${string}`,
    ORACLE_MODULE: '0xAba633927BD8622FBBDd35D291A914c2fDAaE1Ff' as `0x${string}`,
    LIQUIDATION_MODULE: '0x981a29dC987136d23dF5a0f67d86f428Fb40E8Aa' as `0x${string}`,
    POINTS_MODULE: '0x59525b9b23ADc475EF91d98dAe06B568BA574Ce5' as `0x${string}`,
    LIMIT_ORDER: '0x3FC737910B83381FD8288fD6c6d33Dacdf05307B' as `0x${string}`,
    KEEPER_FEE: '0xe68D0FE1dA19D07a9265BD3cE0EFc4BfFB5EC715' as `0x${string}`,
    VIEWER: '0x509b85EEF0df77992b29aeDdD22C7119Db87ce16' as `0x${string}`,
    RETH_TOKEN: '0xb6fe221fe9eef5aba221c348ba20a1bf5e73624c' as `0x${string}`
} as const;
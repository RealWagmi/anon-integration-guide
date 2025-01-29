import { ChainId } from '@heyanon/sdk';

export const supportedChains = [ChainId.ETHEREUM];

type ChainConfig = {
    providerUrl: string;
    subGraphUrl: string;
};

export const config: Partial<Record<ChainId, ChainConfig>> = {
    // mainnet
    1: {
        providerUrl: 'https://mainnet.infura.io/v3/fa1bf2cea12147559c9634e80be76d61',
        subGraphUrl: 'https://subgraph.satsuma-prod.com/49eb322da234/solidant/spool-v2/api',
    },
};

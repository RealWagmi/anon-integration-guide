import { ChainId } from '@heyanon/sdk';

export const supportedChains = [ChainId.ETHEREUM];

export type ChainConfig = {
    providerUrl: string;
    subGraphUrl: string;
    functions: {
        deposit: {
            referralAddress: string;
            allowedVaults: Array<string>;
        };
    };
    deployments: {
        ISmartVaultManager: string;
    };
};

export const config: Partial<Record<ChainId, ChainConfig>> = {
    // mainnet
    1: {
        providerUrl: 'https://mainnet.infura.io/v3/fa1bf2cea12147559c9634e80be76d61',
        subGraphUrl: 'https://subgraph.satsuma-prod.com/49eb322da234/solidant/spool-v2/api',
        functions: {
            deposit: {
                referralAddress: '0x0000000000000000000000000000000000000000',
                allowedVaults: ['0xf07ac7f7dac4eaab2e4c6fc78230d8256df33cc8'],
            },
        },
        deployments: {
            ISmartVaultManager: '0x23Daf34e2b9Af02A74dC19cB52Af727B19403874',
        },
    },
};

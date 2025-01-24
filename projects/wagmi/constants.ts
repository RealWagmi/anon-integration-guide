import { ChainId } from '@heyanon/sdk';
import { Address } from 'viem';

export const sWagmiSupportedChains = [ChainId.KAVA, ChainId.METIS, ChainId.SONIC];

export const sWagmiAddresses = {
    [ChainId.KAVA]: '0x3690d1a9fb569c21372f8091527ab44f1dc9630f',
    [ChainId.METIS]: '0x5fb3983adc4dCc82A610a91D2e329F6401352558',
    [ChainId.SONIC]: '0x4b5d9db7910448e2F236509D9eE242673AFa28aA',
} satisfies Record<number, Address>;

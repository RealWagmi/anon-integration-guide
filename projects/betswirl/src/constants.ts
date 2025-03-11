import { Chain, EVM } from '@heyanon/sdk';

const { ChainIds } = EVM.constants;

export const supportedChains = [ChainIds[Chain.BASE], ChainIds[Chain.ARBITRUM], ChainIds[Chain.AVALANCHE], ChainIds[Chain.POLYGON], ChainIds[Chain.BSC]];

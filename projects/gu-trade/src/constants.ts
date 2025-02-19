import { Chain, EVM } from '@heyanon/sdk';

const { ChainIds } = EVM.constants;

export const supportedChains = [ChainIds[Chain.ARBITRUM]];

export const FACTORY_ADDRESS = '0x4b76208FdC0eeafA8635021b3BF1cd692a9b8B14';
export const ETH_USD_ORACLE_ADDRESS = '0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612';
export const GU_COIN_DECIMALS = 18;
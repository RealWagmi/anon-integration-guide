import { Chain, EVM } from '@heyanon/sdk';
const { ChainIds } = EVM.constants;

export const supportedChains = [ChainIds[Chain.ETHEREUM]];
export const fetchLidoAPRApiUrl = 'https://eth-api.lido.fi/v1/protocol/steth/apr/last';
export const fetchTotalRewardsApiEndpoint = 'https://reward-history-backend.lido.fi';
export const stETH_ADDRESS = '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84'; // stETH contract address
export const wstETH_ADDRESS = '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0'; // stETH contract address
export const LIDO_WITHDRAWAL_ADDRESS = '0x889edC2eDab5f40e902b864aD4d7AdE8E412F9B1'; //Withdrawal Queue Contract Address
export const REFERRAL_ADDRESS = '0x0000000000000000000000000000000000000000'; // Referral address

import { Chain, EVM } from "@heyanon/sdk";
const { ChainIds } = EVM.constants;

export const supportedChains = [
  ChainIds[Chain.BSC],
  ChainIds[Chain.ETHEREUM],
  ChainIds[Chain.BASE],
];

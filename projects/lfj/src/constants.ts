import { WNATIVE, Token, ChainId } from "@traderjoe-xyz/sdk-core";
import { LiquidityDistribution } from "@traderjoe-xyz/sdk-v2";

export const supportedChains: number[] = [
  ChainId.AVALANCHE,
  ChainId.ARBITRUM_ONE,
];

export const swapBases = {
  [ChainId.ARBITRUM_ONE]: [
    new Token(
      ChainId.ARBITRUM_ONE,
      "0xaf88d065e77c8cc2239327c5edb3a432268e5831",
      6,
      "USDC",
      "USD Coin ",
    ),
    new Token(
      ChainId.ARBITRUM_ONE,
      "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
      6,
      "USDT",
      "Tether USD",
    ),
    new Token(
      ChainId.ARBITRUM_ONE as number,
      "0x912CE59144191C1204E64559FE8253a0e49E6548",
      18,
      "ARB",
      "ARBITRUM_ONE",
    ),
    WNATIVE[ChainId.ARBITRUM_ONE],
  ],
  [ChainId.AVALANCHE]: [
    new Token(
      ChainId.AVALANCHE as number,
      "0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e",
      6,
      "USDC",
      "USD Coin",
    ),
    new Token(
      ChainId.AVALANCHE as number,
      "0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7",
      6,
      "USDT",
      "Tether USD",
    ),
    WNATIVE[ChainId.AVALANCHE],
  ],
};
export const liquidityDistribution: Record<
  "spot" | "curve" | "bidask",
  LiquidityDistribution
> = {
  spot: LiquidityDistribution.SPOT,
  curve: LiquidityDistribution.CURVE,
  bidask: LiquidityDistribution.BID_ASK,
};

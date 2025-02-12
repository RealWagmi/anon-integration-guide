import { ChainId } from '@heyanon/sdk';

export const supportedChains = [ChainId.BASE];

export const LP_SUGAR_ADDRESS = '0x92294D631E995f1dd9CeE4097426e6a71aB87Bcf';
export const MIXED_QUOTER_ADDRESS = '0x0A5aA5D3a4d28014f967Bf0f29EAA3FF9807D5c6';
export const UNIVERSAL_ROUTER_ADDRESS = '0x6cb442acf35158d5eda88fe602221b67b400be3e';

export const FEE_SIZE = 3;

export type FeeAmount = 'LOW' | 'MEDIUM' | 'HIGH';

export const feeAmounts = {
    LOW: 500,
    MEDIUM: 3000,
    HIGH: 10000,
} as const;

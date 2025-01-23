import { getChainFromName } from '@heyanon/sdk';
import { Address, isAddress } from 'viem';
import { SUPPORTED_CHAINS } from './constants.js';
import { Price, Token } from '@uniswap/sdk-core';
import JSBI from 'jsbi';

type Result<Data> =
    | {
          success: false;
          errorMessage: string;
      }
    | {
          success: true;
          data: Data;
      };

export function parseWallet(
    chainName: string,
    account: string,
): Result<{ account: Address; chainId: number }> {
    if (!account) return { success: false, errorMessage: 'Wallet not connected' };
    if (!isAddress(account))
        return { success: false, errorMessage: 'Expected account to be a valid address' };

    const chainId = getChainFromName(chainName);

    if (!chainId)
        return { success: false, errorMessage: `Unsupported chain name: ${chainName}` };
    if (!SUPPORTED_CHAINS.includes(chainId))
        return {
            success: false,
            errorMessage: `Protocol is not supported on ${chainName}`,
        };

    return {
        success: true,
        data: {
            account,
            chainId,
        },
    };
}

export function parsePrice(baseToken: Token, quoteToken: Token, value: string) {
    if (!value.match(/^\d*\.?\d+$/)) {
        return undefined;
    }

    const [whole, fraction] = value.split('.');

    const decimals = fraction?.length ?? 0;
    const withoutDecimals = JSBI.BigInt((whole ?? '') + (fraction ?? ''));

    return new Price(
        baseToken,
        quoteToken,
        JSBI.multiply(JSBI.BigInt(10 ** decimals), JSBI.BigInt(10 ** baseToken.decimals)),
        JSBI.multiply(withoutDecimals, JSBI.BigInt(10 ** quoteToken.decimals)),
    );
}

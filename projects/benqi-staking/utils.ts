import { getChainFromName } from '@heyanon/sdk';
import { Address, isAddress, parseUnits } from 'viem';
import { supportedChains } from './constants';

type Result<Data> =
    | {
          success: false;
          errorMessage: string;
      }
    | {
          success: true;
          data: Data;
      };

export const parseWallet = <Props extends { account: string; chainName: string }>({ account, chainName }: Props): Result<{ account: Address; chainId: number }> => {
    if (!account) return { success: false, errorMessage: 'Wallet not connected' };
    if (!isAddress(account)) return { success: false, errorMessage: 'Expected account to be a valid address' };

    const chainId = getChainFromName(chainName);

    if (!chainId) return { success: false, errorMessage: `Unsupported chain name: ${chainName}` };
    if (!supportedChains.includes(chainId)) return { success: false, errorMessage: `Protocol is not supported on ${chainName}` };

    return {
        success: true,
        data: {
            account,
            chainId,
        },
    };
};

export const parseAmount = <Props extends { amount: string; decimals: number }>({ amount, decimals }: Props): Result<bigint> => {
    if (!amount || typeof amount !== 'string') return { success: false, errorMessage: 'Amount must be a string' };

    const parsedAmount = parseUnits(amount, decimals);
    if (parsedAmount === 0n) return { success: false, errorMessage: 'Amount must be greater than 0' };

    return {
        success: true,
        data: parsedAmount,
    };
};

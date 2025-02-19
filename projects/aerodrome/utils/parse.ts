import { getChainFromName } from '@heyanon/sdk';
import { Address, isAddress, parseUnits } from 'viem';
import { CommandList, FEE_AMOUNTS, FeeAmount, supportedChains, V2SwapExactIn, V3SwapExactIn } from '../constants';

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

export const parseTokensAndFee = <Props extends { token0: Address, token1: Address, fee?: FeeAmount }>({token0, token1, fee}: Props): Result<{ token0: Address, token1: Address, fee: FeeAmount }> => {
    return {
        success: true,
        data: {
            token0,
            token1,
            fee: fee ?? "V3_LOW"
        }
    }
}
export const parseTokensAndFees = <Props extends { tokens: Address[]; fees: FeeAmount[] }>({ tokens, fees }: Props): Result<{ tokens: Address[]; fees: FeeAmount[] }> => {
    if (!Array.isArray(tokens)) return { success: false, errorMessage: 'Expected tokens to be an array' };

    if (!Array.isArray(fees)) return { success: false, errorMessage: 'Expected fees to be an array' };

    if (tokens.length < 2) return { success: false, errorMessage: 'Expected at least two tokens' };

    if (fees.length < 1) return { success: false, errorMessage: 'Expected at least one fee' };

    if (tokens.length !== fees.length + 1) return { success: false, errorMessage: 'Incorrect amount of fees in relation to tokens' };

    return {
        success: true,
        data: {
            tokens,
            fees,
        },
    };
};

export const parseCommandList = <Props extends { commandList: CommandList }>({ commandList }: Props): Result<{ commandList: CommandList }> => {
    return {
        success: true,
        data: {
            commandList
        }
    }
}

export const parseSwap = <Props extends { swap: V3SwapExactIn }>({ swap }: Props): Result<{ swap: V3SwapExactIn }> => {
    return {
        success: true,
        data: {
            swap
        }
    }
}

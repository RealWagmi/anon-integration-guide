import { EVM, EvmChain } from '@heyanon/sdk';
import { Address } from 'viem';
import { WITHELISTED_TOKENS, supportedChains } from './constants';

const { getChainFromName } = EVM.utils;

type Result<Data> =
    | {
        success: false;
        errorMessage: string;
    }
    | {
        success: true;
        data: Data;
    };

export const validateWallet = <Props extends { account: Address }>({ account }: Props): Result<{ account: Address }> => {
    if (!account) return { success: false, errorMessage: 'Wallet not connected' };
    return {
        success: true,
        data: {
            account,
        },
    };
};

export const validateAndGetTokenDetails = <Props extends { chainName: string; tokenSymbol: string }>({
    chainName,
    tokenSymbol,
}: Props): Result<{
    chainId: number;
    tokenAddress: Address;
}> => {
    const chainId = getChainFromName(chainName as EvmChain);
    if (!chainId) return { success: false, errorMessage: `Unsupported chain name: ${chainName}` };
    if (supportedChains.indexOf(chainId) === -1) return { success: false, errorMessage: `Hypersonic is not supported on ${chainName}` };

    const tokenDetails = WITHELISTED_TOKENS[chainId][tokenSymbol.toUpperCase()];
    if (!tokenDetails) return { success: false, errorMessage: `Token ${tokenSymbol} not found on chain ${chainName}` };

    return {
        success: true,
        data: {
            chainId,
            tokenAddress: tokenDetails.address,
        },
    };
};
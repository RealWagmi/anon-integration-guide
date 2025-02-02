import {ChainId, getChainFromName} from '@heyanon/sdk';
import {Address, isAddress,} from 'viem';
import {CORE_POOL_MARKET_TOKENS, supportedChains, supportedPools, POOLS, BLOCKS_PER_YEAR} from "./constants";

type Result<Data> =
    | {
    success: false;
    errorMessage: string;
}
    | {
    success: true;
    data: Data;
};

export const validateWallet = <Props extends { account: Address; }>
({account}: Props): Result<{ account: Address; }> => {
    if (!account) return {success: false, errorMessage: 'Wallet not connected'};
    return {
        success: true,
        data: {
            account,
        },
    };
};

const validateOrDefaultPool = (pool: string | undefined, supportedPools: string[]): string => {
    const defaultPool = supportedPools[0];
    return !pool || (supportedPools.indexOf(pool) === -1) ? defaultPool : pool;
};


export const validateAndGetTokenDetails = <Props extends { chainName: string; pool: string; token: string }>
({chainName, pool, token}: Props): Result<{
    chainId: ChainId;
    poolAddress: Address,
    tokenAddress: Address,
    tokenDecimals: number,
    isChainBased?: boolean
    blocksPerYear: number
}> => {
    pool = validateOrDefaultPool(pool.toUpperCase(), supportedPools);
    const poolDetails = POOLS[pool];
    const chainId = getChainFromName(chainName);
    if (!chainId) return {success: false, errorMessage: `Unsupported chain name: ${chainName}`};
    if (supportedChains.indexOf(chainId) === -1 || !poolDetails.poolTokens[chainId])
        return {success: false, errorMessage: `Protocol is not supported on ${chainName}`};
    const tokenDetails = poolDetails.poolTokens[chainId][token.toUpperCase()];
    if (!tokenDetails) return {success: false, errorMessage: `Token ${token} not found on chain ${chainName}`};
    const poolAddress = poolDetails.poolAddress;
    const tokenAddress = tokenDetails.address;
    const tokenDecimals = tokenDetails.decimals;
    const isChainBased = tokenDetails.chainBased;
    const blocksPerYear = BLOCKS_PER_YEAR[chainId];
    return {
        success: true,
        data: {
            chainId,
            poolAddress,
            tokenAddress,
            tokenDecimals,
            isChainBased,
            blocksPerYear,
        },
    };
}
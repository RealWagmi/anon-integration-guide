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


export const validateAndGetTokenDetails = <Props extends { chainName: string; pool: string; tokenSymbol: string }>
({chainName, pool, tokenSymbol}: Props): Result<{
    chainId: ChainId;
    poolAddress: Address,
    vTokenAddress: Address,
    vTokenDecimals: number,
    tokenDecimals: number,
    isChainBased?: boolean,
    blocksPerYear: bigint
}> => {
    pool = validateOrDefaultPool(pool.toUpperCase(), supportedPools);
    const poolDetails = POOLS[pool];
    const chainId = getChainFromName(chainName);
    if (!chainId) return {success: false, errorMessage: `Unsupported chain name: ${chainName}`};
    if (supportedChains.indexOf(chainId) === -1 || !poolDetails.poolTokens[chainId])
        return {success: false, errorMessage: `Protocol is not supported on ${chainName}`};
    const tokenDetails = poolDetails.poolTokens[chainId][tokenSymbol.toUpperCase()];
    if (!tokenDetails) return {success: false, errorMessage: `Token ${tokenSymbol} not found on chain ${chainName}`};
    const poolAddress = poolDetails.poolAddress;
    const vTokenAddress = tokenDetails.vTokenAddress;
    const vTokenDecimals = tokenDetails.vTokenDecimals;
    const tokenDecimals = tokenDetails.decimals;
    const isChainBased = tokenDetails.chainBased;
    const blocksPerYear = BLOCKS_PER_YEAR[chainId];
    return {
        success: true,
        data: {
            chainId,
            poolAddress,
            vTokenAddress,
            vTokenDecimals,
            tokenDecimals,
            isChainBased,
            blocksPerYear
        },
    };
}
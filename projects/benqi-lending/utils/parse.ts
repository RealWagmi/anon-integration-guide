import { getChainFromName } from '@heyanon/sdk';
import { Address, isAddress, parseUnits } from 'viem';
import { AVAX_NAME, CORE_MARKETS, ECOSYSTEM_MARKETS, MarketListProps, MarketProps, supportedChains } from '../constants';

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

export const parseMarket = <Props extends MarketProps>({ marketName, marketType }: Props): Result<MarketProps & { marketAddress: Address }> => {
    if (!marketName) return { success: false, errorMessage: 'Incorrect market name specified' };

    if (marketType === 'core') {
        if (!CORE_MARKETS[marketName]) return { success: false, errorMessage: 'Incorrect market specified' };

        const marketAddress = CORE_MARKETS[marketName];

        return {
            success: true,
            data: {
                marketType,
                marketName,
                marketAddress,
            },
        };
    }

    if (marketType === 'ecosystem') {
        if (!ECOSYSTEM_MARKETS[marketName]) return { success: false, errorMessage: 'Incorrect market specified' };

        const marketAddress = ECOSYSTEM_MARKETS[marketName];

        return {
            success: true,
            data: {
                marketType,
                marketName,
                marketAddress,
            },
        };
    }

    return { success: false, errorMessage: 'Incorrect market type specified' };
};

export const parseMarketList = <Props extends MarketListProps>({ marketType, marketNames }: Props): Result<MarketListProps & { marketAddresses: Address[] }> => {
    if (!Array.isArray(marketNames)) return { success: false, errorMessage: 'Expected market names to be an array' };

    if (!marketNames.length) return { success: false, errorMessage: 'Expected at least one market name' };

    if (marketType === 'core') {
        const names = new Set(marketNames);
        const marketAddresses: Address[] = [];

        for (const name of names) {
            const address = CORE_MARKETS[name];

            if (!address) {
                return { success: false, errorMessage: `Cannot find ${name} market` };
            }

            marketAddresses.push(address);
        }

        return {
            success: true,
            data: {
                marketType,
                marketNames: Array.from(names),
                marketAddresses,
            },
        };
    }

    if (marketType === 'ecosystem') {
        const names = new Set(marketNames);
        const marketAddresses: Address[] = [];

        for (const name of names) {
            const address = ECOSYSTEM_MARKETS[name];

            if (!address) {
                return { success: false, errorMessage: `Cannot find ${name} market` };
            }

            marketAddresses.push(address);
        }

        return {
            success: true,
            data: {
                marketType,
                marketNames: Array.from(names),
                marketAddresses,
            },
        };
    }

    return { success: false, errorMessage: 'Incorrect market type specified' };
};

export const isERC20Based = (props: MarketProps): boolean => {
    return props.marketType !== 'core' || props.marketName !== AVAX_NAME;
};

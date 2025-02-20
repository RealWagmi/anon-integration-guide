import { Address, parseUnits, isAddress } from 'viem';
import { FunctionReturn, FunctionOptions, toResult, getChainFromName } from '@heyanon/sdk';
import { chainIdToNetworkNameMap, MAGPIE_BASE_URL, networkIdToChainNameMap, supportedChains } from './constants';
import { Balance, BalancesResponse, QuoteResponse, Token, TokensResponse, TransactionResponse } from './types';
import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: MAGPIE_BASE_URL,
    timeout: 3000,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const getToken = async (
    {
        chainName,
        address,
    }: {
        chainName: string;
        address: string;
    },
    { notify }: FunctionOptions,
): Promise<{ result?: FunctionReturn; token?: Token }> => {
    await notify(`Get token info for ${address} on ${chainName}...`);
    try {
        const chainId = getChainFromName(chainName);
        const networkName = chainIdToNetworkNameMap.get(chainId);
        const response = await axiosInstance.get<Token>('/token-manager/token', {
            params: {
                networkName,
                address,
            },
        });

        return {
            token: response.data,
        };
    } catch (e) {
        if (e.response?.status < 500) {
            if (e.response?.data?.message) {
                return {
                    result: toResult(e.response.data.message, true),
                };
            }
            return {
                result: toResult(`Unexpected error occurred while getting ${address} token`, true),
            };
        }

        return {
            result: toResult(`Magpie server is not available`, true),
        };
    }
};

export const getTokens = async (
    {
        searchValue,
    }: {
        searchValue: Address[] | string;
    },
    { notify }: FunctionOptions,
): Promise<{ result?: FunctionReturn; tokens?: Token[] }> => {
    const isString = typeof searchValue === 'string';
    await notify(`Get token info for ${isString ? searchValue : searchValue.join(',')}...`);
    try {
        const networkNames = supportedChains.map((chainId) => chainIdToNetworkNameMap.get(chainId));
        const response = await axiosInstance.post<TokensResponse>('/token-manager/tokens', {
            networkNames,
            searchValue,
            exact: !isString || isAddress(searchValue),
            offset: 0,
        });

        const tokens = response.data.map(({ id, name, symbol, address, decimals, displayDecimals, isReliable, logoUrl, usdPrice, network }) => ({
            id,
            name,
            symbol,
            address,
            decimals,
            displayDecimals,
            isReliable,
            logoUrl,
            usdPrice,
            chainName: networkIdToChainNameMap.get(network.id),
        }));

        return {
            tokens,
        };
    } catch (e) {
        if (e.response?.status < 500) {
            if (e.response?.data?.message) {
                return {
                    result: toResult(e.response.data.message, true),
                };
            }
            return {
                result: toResult(`Unexpected error occurred while getting ${tokenAddresses.join(',')} tokens`, true),
            };
        }

        return {
            result: toResult(`Magpie server is not available`, true),
        };
    }
};

export const getBalances = async (
    {
        account,
    }: {
        account: Address;
    },
    { notify }: FunctionOptions,
): Promise<{ result?: FunctionReturn; balances?: Balance[] }> => {
    await notify(`Get balances for ${account}...`);
    try {
        const networkNames = supportedChains.map((chainId) => chainIdToNetworkNameMap.get(chainId));
        const response = await axiosInstance.post<BalancesResponse>('/balance-manager/balances', {
            networkNames,
            walletAddresses: [account],
            offset: 0,
        });

        const balances = response.data.map(({ walletAddress, tokenAddress, amount, networkId }) => ({
            walletAddress,
            tokenAddress,
            amount,
            chainName: networkIdToChainNameMap.get(networkId),
        }));

        return {
            balances,
        };
    } catch (e) {
        if (e.response?.status < 500) {
            if (e.response?.data?.message) {
                return {
                    result: toResult(e.response.data.message, true),
                };
            }
            return {
                result: toResult(`Unexpected error occurred while getting ${account} balances`, true),
            };
        }

        return {
            result: toResult(`Magpie server is not available`, true),
        };
    }
};

export const getQuote = async (
    {
        chainName,
        fromToken,
        toToken,
        amount,
        slippage,
        fromAddress,
        toAddress,
    }: {
        chainName: string;
        fromToken: Token;
        toToken: Token;
        amount: string;
        slippage: number;
        fromAddress: Address;
        toAddress: Address;
    },
    { notify }: FunctionOptions,
): Promise<{ result?: FunctionReturn; quote?: QuoteResponse }> => {
    await notify(`Get a quote for ${amount} ${fromToken.symbol} to ${toToken.symbol} conversion...`);
    try {
        const chainId = getChainFromName(chainName);
        const network = chainIdToNetworkNameMap.get(chainId);
        const response = await axiosInstance.get<QuoteResponse>('/aggregator/quote', {
            params: {
                network,
                fromTokenAddress: fromToken.address,
                toTokenAddress: toToken.address,
                sellAmount: parseUnits(amount, fromToken.decimals),
                slippage,
                gasless: false,
                fromAddress,
                toAddress,
            },
        });

        return { quote: response.data };
    } catch (e) {
        if (e.response?.status < 500) {
            if (e.response?.data?.message) {
                return {
                    result: toResult(e.response.data.message, true),
                };
            }
            return {
                result: toResult(`Unexpected error occurred while getting quote`, true),
            };
        }

        return {
            result: toResult(`Magpie server is not available`, true),
        };
    }
};

export const getTransaction = async (
    {
        quoteId,
    }: {
        quoteId: string;
    },
    { notify }: FunctionOptions,
): Promise<{ result?: FunctionReturn; transaction?: TransactionResponse }> => {
    await notify(`Get transaction data for execution...`);
    try {
        const response = await axiosInstance.get<TransactionResponse>('/aggregator/transaction', {
            params: {
                quoteId,
                estimateGas: false,
            },
        });

        return { transaction: response.data };
    } catch (e) {
        if (e.response?.status < 500) {
            if (e.response?.data?.message) {
                return {
                    result: toResult(e.response.data.message, true),
                };
            }
            return {
                result: toResult(`Unexpected error occurred while getting transaction data`, true),
            };
        }

        return {
            result: toResult(`Magpie server is not available`, true),
        };
    }
};

import { Address } from 'viem';
import { FunctionReturn, FunctionOptions, toResult, getChainFromName } from '@heyanon/sdk';
import {
    getAllMarketsOnChain,
    getMarketConfigByChainAndMarketAddress,
    getMarketConfigByChainAndTokenAddress,
    MarketConfig,
    SECONDS_PER_YEAR,
    supportedChains,
    SupprotedChainsType,
} from '../constants';
import { cometAbi } from '../abis';

interface Props {
    chainName: string;
    account: Address;
    marketAddress: Address;
}

/**
 *
 * @param param0 - chainName, account, token, where token name is USDT, USDC, etc. See enum {MarketBaseAssets}
 * @param param1 - tools
 * @description Get lend APR for token on specific networ for Compound protocol
 * @docs https://docs.compound.finance/interest-rates/#get-supply-rate
 * @returns
 */
export async function getPosition({ chainName, account }: Props, { getProvider }: FunctionOptions): Promise<FunctionReturn> {
    // Check wallet connection
    if (!account) return toResult('Wallet not connected', true);

    // Validate chain
    const chainId = getChainFromName(chainName) as SupprotedChainsType;
    if (!chainId) return toResult('Unsupported chain name: {chainName}', true);
    if (!supportedChains.includes(chainId)) return toResult('Protocol is not supported on \${chainName}', true);

    // Get market config for chain and token
    const marketConfigs = getAllMarketsOnChain(chainId);
    if (!marketConfigs || !marketConfigs.length) return toResult('Market not found', true);

    const marketAddresses = marketConfigs.map((market) => market.cometAddress);

    try {
        const provider = getProvider(chainId);

        const multicallData = [
            ...marketAddresses.map((market) => {
                return {
                    address: market,
                    abi: cometAbi,
                    functionName: 'balanceOf',
                    args: [account],
                };
            }),
        ];

        const balances = await provider.multicall({
            contracts: multicallData as any[],
        });

        const balancesWithDecimals = marketConfigs.map((market: MarketConfig, i) => {
            return {
                market: market,
                balance: Number(balances[i].result) / 10 ** market.baseAssetDecimals,
            };
        });

        return toResult(`Positions: ${balancesWithDecimals.map((balance) => `${balance.market.name}: ${balance.balance.toFixed(2)}`).join(', ')}`);
    } catch (error) {
        return toResult(`Failed to get all positions on ${chainId}`, true);
    }
}

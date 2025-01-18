import { Address } from 'viem';
import { FunctionReturn, FunctionOptions, toResult, getChainFromName } from '@heyanon/sdk';
import { getMarketConfigByChainAndMarketAddress, getMarketConfigByChainAndTokenAddress, SECONDS_PER_YEAR, supportedChains, SupprotedChainsType } from '../constants';
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
export async function getPosition({ chainName, account, marketAddress }: Props, { getProvider }: FunctionOptions): Promise<FunctionReturn> {
    // Check wallet connection
    if (!account) return toResult('Wallet not connected', true);

    // Validate chain
    const chainId = getChainFromName(chainName) as SupprotedChainsType;
    if (!chainId) return toResult('Unsupported chain name: {chainName}', true);
    if (!supportedChains.includes(chainId)) return toResult('Protocol is not supported on \${chainName}', true);

    // Get market config for chain and token
    const marketConfig = getMarketConfigByChainAndMarketAddress(chainId, marketAddress);
    if (!marketConfig) return toResult('Market not found', true);

    try {
        const provider = getProvider(chainId);

        const balanceOf = await provider.readContract({
            address: marketAddress,
            abi: cometAbi,
            functionName: 'balanceOf',
            args: [account],
        });

        const decimalBalance = Number(balanceOf) / 10 ** marketConfig.baseAssetDecimals;

        return toResult(`Position on ${marketConfig.name}: ${decimalBalance.toFixed(2)}`);
    } catch (error) {
        return toResult(`Failed to get supply APR for ${marketConfig.name}`, true);
    }
}

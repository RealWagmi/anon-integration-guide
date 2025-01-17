import { Address } from 'viem';
import { FunctionReturn, FunctionOptions, toResult, getChainFromName } from '@heyanon/sdk';
import { getMarketConfigByChainAndTokenAddress, SECONDS_PER_YEAR, supportedChains, SupprotedChainsType } from '../constants';
import { cometAbi } from '../abis';

interface Props {
    chainName: string;
    account: Address;
    tokenAddress: Address;
}

/**
 *
 * @param param0 - chainName, account, token, where token name is USDT, USDC, etc. See enum {MarketBaseAssets}
 * @param param1 - tools
 * @description Get lend APR for token on specific networ for Compound protocol
 * @docs https://docs.compound.finance/interest-rates/#get-supply-rate
 * @returns
 */
export async function getLendApr({ chainName, account, tokenAddress }: Props, { getProvider }: FunctionOptions): Promise<FunctionReturn> {
    // Check wallet connection
    if (!account) return toResult('Wallet not connected', true);

    // Validate chain
    const chainId = getChainFromName(chainName) as SupprotedChainsType;
    if (!chainId) return toResult('Unsupported chain name: {chainName}', true);
    if (!supportedChains.includes(chainId)) return toResult('Protocol is not supported on \${chainName}', true);

    // Get market config for chain and token
    const marketConfig = getMarketConfigByChainAndTokenAddress(chainId, tokenAddress);
    if (!marketConfig) return toResult('Market not found', true);

    const cometAddress = marketConfig.cometAddress;

    try {
        const provider = getProvider(chainId);

        // https://docs.compound.finance/interest-rates/#get-supply-rate
        const utilization = await provider.readContract({
            address: cometAddress,
            abi: cometAbi,
            functionName: 'getUtilization',
        });

        // We cannot use multicall for optimization, as getBorrowRate requires current utilization
        const supplyRate = await provider.readContract({
            address: cometAddress,
            abi: cometAbi,
            functionName: 'getSupplyRate',
            args: [utilization],
        });

        const supplyAPR = (Number(supplyRate) / 10 ** 18) * SECONDS_PER_YEAR * 100;

        return toResult(supplyAPR.toString());
    } catch (error) {
        return toResult(`Failed to get supply APR for ${marketConfig.name}`, true);
    }
}

import { Address } from 'viem';
import { FunctionReturn, FunctionOptions, toResult, getChainFromName } from '@heyanon/sdk';
import { getMarketConfigByChainAndToken, MarketBaseAssets, SECONDS_PER_YEAR, supportedChains } from '../constants';
import { cometAbi } from '../abis/cometAbi';

interface Props {
    chainName: string;
    account: Address;
    token: MarketBaseAssets;
}

/**
 *
 * @param param0 - chainName, account, token, where token name is USDT, USDC, etc. See enum {MarketBaseAssets}
 * @param param1 - tools
 * @description Get borrow APR for token on specific networ for Compound protocol
 * @docs https://docs.compound.finance/interest-rates/#get-borrow-rate
 */
export async function getBorrowApr({ chainName, account, token }: Props, { sendTransactions, notify, getProvider }: FunctionOptions): Promise<FunctionReturn> {
    // Check wallet connection
    if (!account) return toResult('Wallet not connected', true);

    // Validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult('Unsupported chain name: {chainName}', true);
    if (!supportedChains.includes(chainId)) return toResult('Protocol is not supported on \${chainName}', true);

    // Get market config for chain and token
    const marketConfig = getMarketConfigByChainAndToken(chainId, token);
    if (!marketConfig) return toResult('Market not found', true);

    const cometAddress = marketConfig.cometAddress;

    try {
        const provider = getProvider(chainId);

        // https://docs.compound.finance/interest-rates/#get-borrow-rate
        const utilization = await provider.readContract({
            address: cometAddress,
            abi: cometAbi,
            functionName: 'getUtilization',
        });

        // We cannot use multicall for optimization, as getBorrowRate requires current utilization
        const borrowRate = await provider.readContract({
            address: cometAddress,
            abi: cometAbi,
            functionName: 'getBorrowRate',
            args: [utilization],
        });

        const borrowAPR = (Number(borrowRate) / 10 ** 18) * SECONDS_PER_YEAR * 100;

        return toResult(borrowAPR.toString());
    } catch (error) {
        return toResult(`Failed to get borrow APR for ${token}`, true);
    }
}

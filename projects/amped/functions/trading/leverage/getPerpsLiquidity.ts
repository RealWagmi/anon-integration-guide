import { Address, isAddress, formatUnits } from 'viem';
import { FunctionReturn, FunctionOptions, toResult, getChainFromName } from '@heyanon/sdk';
import { CONTRACT_ADDRESSES, NETWORKS } from '../../../constants.js';
import { Vault } from '../../../abis/Vault.js';
import { VaultPriceFeed } from '../../../abis/VaultPriceFeed.js';

interface Props {
    chainName: (typeof NETWORKS)[keyof typeof NETWORKS];
    account: Address;
    indexToken: Address;
    collateralToken: Address;
    isLong: boolean;
}

interface LiquidityInfo {
    maxLeverage: number;
    poolAmount: string;
    poolAmountUsd: string;
    reservedAmount: string;
    reservedAmountUsd: string;
    availableLiquidity: string;
    availableLiquidityUsd: string;
    fundingRate: string;
    priceUsd: string;
}

/**
 * Gets perpetual trading liquidity information for a token on Amped Finance
 * @param props - The function parameters
 * @param props.chainName - The name of the chain (must be "sonic")
 * @param props.account - The account address to check liquidity for
 * @param props.indexToken - The token to trade (e.g., WETH, ANON)
 * @param props.collateralToken - The token to use as collateral
 * @param props.isLong - Whether this is for a long position
 * @param options - System tools for blockchain interactions
 * @returns Information about token liquidity and trading parameters
 */
export async function getPerpsLiquidity({ chainName, account, indexToken, collateralToken, isLong }: Props, { getProvider, notify }: FunctionOptions): Promise<FunctionReturn> {
    // Validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (chainName !== NETWORKS.SONIC) {
        return toResult('This function is only supported on Sonic chain', true);
    }

    try {
        // Validate addresses
        if (!isAddress(indexToken) || !isAddress(collateralToken)) {
            return toResult('Invalid token addresses provided', true);
        }

        if (indexToken === '0x0000000000000000000000000000000000000000' || collateralToken === '0x0000000000000000000000000000000000000000') {
            return toResult('Zero addresses are not valid tokens', true);
        }

        if (!isAddress(account)) {
            return toResult('Invalid account address provided', true);
        }

        if (account === '0x0000000000000000000000000000000000000000') {
            return toResult('Zero address is not a valid account', true);
        }

        // Validate trading token
        const supportedTradingTokens = [CONTRACT_ADDRESSES[NETWORKS.SONIC].WETH, CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN, CONTRACT_ADDRESSES[NETWORKS.SONIC].ANON];

        if (!supportedTradingTokens.includes(indexToken)) {
            return toResult(`Token ${indexToken} is not supported for trading`, true);
        }

        await notify('Checking perpetual trading liquidity information...');

        const provider = getProvider(chainId);

        const vaultAddress = CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT as Address;
        const priceFeedAddress = CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT_PRICE_FEED as Address;

        await notify('Fetching token price...');
        // Get token price first to validate token is supported
        const priceResponse = (await provider.readContract({
            address: priceFeedAddress,
            abi: VaultPriceFeed,
            functionName: 'getPrice',
            args: [indexToken, isLong, !isLong, true],
        })) as bigint;

        if (priceResponse === 0n) {
            return toResult(`No price feed available for ${indexToken}`, true);
        }

        const priceUsd = Number(formatUnits(priceResponse, 30));
        await notify(`Current price: $${priceUsd.toFixed(4)}`);

        await notify('Fetching pool information...');
        // Get pool and reserved amounts
        const [poolAmount, reservedAmount] = await Promise.all([
            provider.readContract({
                address: vaultAddress,
                abi: Vault,
                functionName: 'poolAmounts',
                args: [indexToken],
            }) as Promise<bigint>,
            provider.readContract({
                address: vaultAddress,
                abi: Vault,
                functionName: 'reservedAmounts',
                args: [indexToken],
            }) as Promise<bigint>,
        ]);

        // Calculate available liquidity
        const availableLiquidity = poolAmount - reservedAmount;

        // Format response data
        const liquidityInfo: LiquidityInfo = {
            maxLeverage: 50, // Fixed at 50x for now
            poolAmount: formatUnits(poolAmount, 18),
            poolAmountUsd: (Number(formatUnits(poolAmount, 18)) * priceUsd).toFixed(2),
            reservedAmount: formatUnits(reservedAmount, 18),
            reservedAmountUsd: (Number(formatUnits(reservedAmount, 18)) * priceUsd).toFixed(2),
            availableLiquidity: formatUnits(availableLiquidity, 18),
            availableLiquidityUsd: (Number(formatUnits(availableLiquidity, 18)) * priceUsd).toFixed(2),
            fundingRate: '0', // Fixed at 0 for now
            priceUsd: priceUsd.toFixed(4),
        };

        await notify(`Pool Amount: ${liquidityInfo.poolAmount} tokens ($${liquidityInfo.poolAmountUsd})`);
        await notify(`Reserved Amount: ${liquidityInfo.reservedAmount} tokens ($${liquidityInfo.reservedAmountUsd})`);
        await notify(`Available Liquidity: ${liquidityInfo.availableLiquidity} tokens ($${liquidityInfo.availableLiquidityUsd})`);

        return toResult(JSON.stringify(liquidityInfo));
    } catch (error) {
        if (error instanceof Error) {
            return toResult(`Failed to get perpetual trading liquidity: ${error.message}`, true);
        }
        return toResult('Failed to get perpetual trading liquidity: Unknown error', true);
    }
}

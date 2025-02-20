import { Address, isAddress, formatUnits } from 'viem';
import { FunctionReturn, FunctionOptions, toResult } from '@heyanon/sdk';
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
    maxLeverage: string;
    poolAmount: string;
    poolAmountUsd: string;
    reservedAmount: string;
    reservedAmountUsd: string;
    availableLiquidity: string;
    availableLiquidityUsd: string;
    fundingRate: string;
    priceUsd: string;
}

interface LiquidityResponse {
    success: boolean;
    info: LiquidityInfo;
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
export async function getPerpsLiquidity({ chainName, account, indexToken, collateralToken, isLong }: Props, options: FunctionOptions): Promise<FunctionReturn> {
    // Validate chain
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
        const supportedTradingTokens = [
            CONTRACT_ADDRESSES[NETWORKS.SONIC].WETH,
            CONTRACT_ADDRESSES[NETWORKS.SONIC].WRAPPED_NATIVE_TOKEN,
            CONTRACT_ADDRESSES[NETWORKS.SONIC].ANON
        ];

        if (!supportedTradingTokens.includes(indexToken)) {
            return toResult(`Token ${indexToken} is not supported for trading`, true);
        }

        await options.notify('Checking perpetual trading liquidity information...');

        const provider = options.evm.getProvider(146);

        // Get token price first to validate token is supported
        await options.notify('Fetching token price...');
        const priceResponse = await provider.readContract({
            address: CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT_PRICE_FEED,
            abi: VaultPriceFeed,
            functionName: 'getPrice',
            args: [indexToken, isLong, !isLong, true],
        }) as bigint;

        if (priceResponse === 0n) {
            return toResult(`No price feed available for ${indexToken}`, true);
        }

        // Get pool and reserved amounts
        await options.notify('Fetching pool information...');
        const [poolAmount, reservedAmount] = await Promise.all([
            provider.readContract({
                address: CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT,
                abi: Vault,
                functionName: 'poolAmounts',
                args: [indexToken],
            }) as Promise<bigint>,
            provider.readContract({
                address: CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT,
                abi: Vault,
                functionName: 'reservedAmounts',
                args: [indexToken],
            }) as Promise<bigint>,
        ]);

        // Calculate available liquidity with safe type conversion
        const availableLiquidity = poolAmount - reservedAmount;

        // Calculate USD values with safe type conversion
        // Need to divide by both 1e30 (price decimals) and 1e18 (token decimals)
        const poolAmountUsd = (poolAmount * priceResponse) / BigInt(1e48);
        const reservedAmountUsd = (reservedAmount * priceResponse) / BigInt(1e48);
        const availableLiquidityUsd = (availableLiquidity * priceResponse) / BigInt(1e48);

        // Format response data with all numeric values as strings
        const liquidityInfo: LiquidityInfo = {
            maxLeverage: '50', // Fixed at 50x for now
            poolAmount: formatUnits(poolAmount, 18),
            poolAmountUsd: formatUnits(poolAmountUsd, 0), // Already divided by all decimals
            reservedAmount: formatUnits(reservedAmount, 18),
            reservedAmountUsd: formatUnits(reservedAmountUsd, 0), // Already divided by all decimals
            availableLiquidity: formatUnits(availableLiquidity, 18),
            availableLiquidityUsd: formatUnits(availableLiquidityUsd, 0), // Already divided by all decimals
            fundingRate: '0', // Fixed at 0 for now
            priceUsd: formatUnits(priceResponse, 30),
        };

        await options.notify(`Pool Amount: ${liquidityInfo.poolAmount} tokens ($${liquidityInfo.poolAmountUsd})`);
        await options.notify(`Reserved Amount: ${liquidityInfo.reservedAmount} tokens ($${liquidityInfo.reservedAmountUsd})`);
        await options.notify(`Available Liquidity: ${liquidityInfo.availableLiquidity} tokens ($${liquidityInfo.availableLiquidityUsd})`);

        const response: LiquidityResponse = {
            success: true,
            info: liquidityInfo,
        };

        return toResult(JSON.stringify(response));
    } catch (error) {
        if (error instanceof Error) {
            return toResult(`Failed to get perpetual trading liquidity: ${error.message}`, true);
        }
        return toResult('Failed to get perpetual trading liquidity: Unknown error', true);
    }
}

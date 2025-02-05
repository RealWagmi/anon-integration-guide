import { type Address, formatUnits } from 'viem';
import { FunctionReturn, FunctionOptions, toResult } from '@heyanon/sdk';
import { CONTRACT_ADDRESSES, NETWORKS } from '../../../constants.js';
import { Vault } from '../../../abis/Vault.js';
import { getChainFromName } from '@heyanon/sdk';

interface Props {
    chainName: (typeof NETWORKS)[keyof typeof NETWORKS];
    account: Address;
}

interface SwapLiquidity {
    token: Address;
    symbol: string;
    poolAmount: string;
    reservedAmount: string;
    availableAmount: string;
    priceUsd: string;
    availableUsd: string;
}

/**
 * Gets swap liquidity information for available tokens on Amped Finance
 * @param props - The function parameters
 * @param props.chainName - The name of the chain (must be "sonic")
 * @param props.account - The account address to check liquidity for
 * @param options - System tools for blockchain interactions
 * @returns Information about token liquidity and their USD values
 */
export async function getSwapsLiquidity({ chainName, account }: Props, { getProvider, notify }: FunctionOptions): Promise<FunctionReturn> {
    // Validate chain using SDK helper
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (chainName !== NETWORKS.SONIC) {
        return toResult('This function is only supported on Sonic chain', true);
    }

    try {
        await notify('Checking swap liquidity...');

        const publicClient = getProvider(chainId); // Use chainId from validation

        // Define tokens to check
        const tokens = [
            { address: CONTRACT_ADDRESSES[NETWORKS.SONIC].ANON, symbol: 'ANON', decimals: 18 },
            { address: CONTRACT_ADDRESSES[NETWORKS.SONIC].WRAPPED_NATIVE_TOKEN, symbol: 'S', decimals: 18 },
            { address: CONTRACT_ADDRESSES[NETWORKS.SONIC].WRAPPED_NATIVE_TOKEN, symbol: 'WS', decimals: 18 },
            { address: CONTRACT_ADDRESSES[NETWORKS.SONIC].USDC, symbol: 'USDC', decimals: 6 },
            { address: CONTRACT_ADDRESSES[NETWORKS.SONIC].WETH, symbol: 'WETH', decimals: 18 },
            { address: CONTRACT_ADDRESSES[NETWORKS.SONIC].EURC, symbol: 'EURC', decimals: 6 },
        ];

        const liquidityResults = [];

        for (const { address, symbol, decimals } of tokens) {
            // Get raw liquidity data
            const [poolAmount, reservedAmount, maxPrice] = await Promise.all([
                publicClient.readContract({
                    address: CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT,
                    abi: Vault,
                    functionName: 'poolAmounts',
                    args: [address],
                }) as Promise<bigint>,
                publicClient.readContract({
                    address: CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT,
                    abi: Vault,
                    functionName: 'reservedAmounts',
                    args: [address],
                }) as Promise<bigint>,
                publicClient.readContract({
                    address: CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT,
                    abi: Vault,
                    functionName: 'getMaxPrice',
                    args: [address],
                }) as Promise<bigint>,
            ]);

            // Calculate available amount
            const availableAmount = poolAmount - reservedAmount;

            // Calculate USD values (price comes in with 30 decimals)
            const priceUsd = formatUnits(maxPrice, 30);
            const availableUsd = (Number(formatUnits(availableAmount, decimals)) * Number(priceUsd)).toString();

            // Format response data
            const swapLiquidity: SwapLiquidity = {
                token: address,
                symbol,
                poolAmount: poolAmount.toString(),
                reservedAmount: reservedAmount.toString(),
                availableAmount: availableAmount.toString(),
                priceUsd,
                availableUsd,
            };

            liquidityResults.push(swapLiquidity);

            // Log liquidity details
            await notify(`\nLiquidity Details for ${symbol}:`);
            await notify(`Pool Amount: ${swapLiquidity.poolAmount}`);
            await notify(`Reserved Amount: ${swapLiquidity.reservedAmount}`);
            await notify(`Available Amount: ${swapLiquidity.availableAmount}`);
            await notify(`Price (USD): $${Number(priceUsd).toFixed(2)}`);
            await notify(`Available Value (USD): $${Number(availableUsd).toFixed(2)}`);
        }

        return toResult(
            JSON.stringify({
                success: true,
                liquidity: liquidityResults,
            }),
        );
    } catch (error) {
        if (error instanceof Error) {
            return toResult(`Failed to get swap liquidity: ${error.message}`, true);
        }
        return toResult('Failed to get swap liquidity: Unknown error', true);
    }
}

import { type Address, formatUnits, type PublicClient } from 'viem';
import { FunctionReturn, FunctionOptions, toResult } from '@heyanon/sdk';
import { CONTRACT_ADDRESSES, NETWORKS, SupportedNetwork } from '../../../constants.js';
import { Vault } from '../../../abis/Vault.js';
import { getChainFromName } from '../../../utils.js';

interface Props {
    chainName: (typeof NETWORKS)[keyof typeof NETWORKS];
    account: Address;
    publicClient?: PublicClient;
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
 * Gets swap liquidity information for available tokens on a given network
 * @param props - The function parameters
 * @param props.chainName - The name of the chain (sonic or base)
 * @param props.account - The account address (used for context, not directly in logic)
 * @param props.publicClient - Viem Public Client for interacting with the blockchain (optional)
 * @param options - System tools (like notify)
 * @returns Information about token liquidity and their USD values
 */
export async function getSwapsLiquidity(
    { chainName, account, publicClient }: Props,
    { notify, getProvider }: FunctionOptions
): Promise<FunctionReturn> {
    // Validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) {
        return toResult(`Network ${chainName} not supported`, true);
    }

    // Use lowercase network name for accessing CONTRACT_ADDRESSES keys
    const networkName = chainName.toLowerCase();
    const networkContracts = CONTRACT_ADDRESSES[networkName];
    
    // Check if contracts for the network exist
    if (!networkContracts || !networkContracts.VAULT) {
        return toResult(`Contract addresses (including VAULT) not found for network: ${networkName}`, true);
    }
    const vaultAddress = networkContracts.VAULT;

    // Use publicClient from props if provided, otherwise get it from options
    const client = publicClient || getProvider(chainId);
    
    // Validate client
    if (!client) {
        return toResult('Failed to get a valid provider for the blockchain', true);
    }
    
    try {
        await notify(`Checking swap liquidity on ${networkName}...`);
        await notify(`Using Vault: ${vaultAddress}`);
        
        // Define tokens to check based on network
        let tokensToCheck: { address: Address; symbol: string; decimals: number }[];
        if (networkName === NETWORKS.SONIC) {
            tokensToCheck = [
                { address: networkContracts.ANON, symbol: 'ANON', decimals: 18 },
                { address: networkContracts.WRAPPED_NATIVE_TOKEN, symbol: 'S', decimals: 18 },
                { address: networkContracts.WRAPPED_NATIVE_TOKEN, symbol: 'WS', decimals: 18 },
                { address: networkContracts.USDC, symbol: 'USDC', decimals: 6 },
                { address: networkContracts.WETH, symbol: 'WETH', decimals: 18 },
                { address: networkContracts.STS, symbol: 'STS', decimals: 18 },
                { address: networkContracts.SCUSD, symbol: 'scUSD', decimals: 6 },
            ];
        } else {
             tokensToCheck = [
                { address: networkContracts.WRAPPED_NATIVE_TOKEN, symbol: 'ETH', decimals: 18 },
                { address: networkContracts.WRAPPED_NATIVE_TOKEN, symbol: 'WETH', decimals: 18 },
                { address: networkContracts.CBBTC, symbol: 'CBBTC', decimals: 18 },
                { address: networkContracts.USDC, symbol: 'USDC', decimals: 6 },
                { address: networkContracts.VIRTUAL, symbol: 'VIRTUAL', decimals: 18 },
            ];
        }

        // Explicitly type the results array
        const liquidityResults: SwapLiquidity[] = [];
        
        const tokenSymbols = tokensToCheck.map(t => t.symbol).join(', ');
        await notify(`Checking tokens: ${tokenSymbols}`);

        for (const { address, symbol, decimals } of tokensToCheck) {
            // Skip if address is somehow undefined (e.g., missing in constants)
            if (!address) {
                 await notify(`Skipping ${symbol}: Address not found in constants for network ${networkName}`);
                 continue;
            }
            
            await notify(`\n- Processing ${symbol} (${address})`);
            // Get raw liquidity data
            const [poolAmount, reservedAmount, maxPrice] = await Promise.all([
                client.readContract({
                    address: vaultAddress,
                    abi: Vault,
                    functionName: 'poolAmounts',
                    args: [address],
                }) as Promise<bigint>,
                client.readContract({
                    address: vaultAddress,
                    abi: Vault,
                    functionName: 'reservedAmounts',
                    args: [address],
                }) as Promise<bigint>,
                client.readContract({
                    address: vaultAddress,
                    abi: Vault,
                    functionName: 'getMaxPrice',
                    args: [address],
                }) as Promise<bigint>,
            ]);

            // Add null/undefined checks
            if (poolAmount === undefined || reservedAmount === undefined || maxPrice === undefined) {
                await notify(`- Failed to get full liquidity data for ${symbol}`);
                continue;
            }
            await notify(`- Raw Data: Pool=${poolAmount}, Reserved=${reservedAmount}, Price=${maxPrice}`);

            // Calculate available amount
            const availableAmount = poolAmount - reservedAmount;

            // Format values as strings
            const formattedPoolAmount = formatUnits(poolAmount, decimals);
            const formattedReservedAmount = formatUnits(reservedAmount, decimals);
            const formattedAvailableAmount = formatUnits(availableAmount, decimals);
            const formattedPriceUsd = formatUnits(maxPrice, 30);
            const availableUsdValue = Number(formattedAvailableAmount) * Number(formattedPriceUsd);
            
            const swapLiquidity: SwapLiquidity = {
                token: address,
                symbol,
                poolAmount: formattedPoolAmount,
                reservedAmount: formattedReservedAmount,
                availableAmount: formattedAvailableAmount,
                priceUsd: formattedPriceUsd,
                availableUsd: availableUsdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            };

            liquidityResults.push(swapLiquidity);

            // Log liquidity details
            await notify(`- Pool Amount: ${formattedPoolAmount}`);
            await notify(`- Reserved Amount: ${formattedReservedAmount}`);
            await notify(`- Available Amount: ${formattedAvailableAmount}`);
            await notify(`- Price (USD): $${Number(formattedPriceUsd).toFixed(6)}`);
            await notify(`- Available Value (USD): $${swapLiquidity.availableUsd}`);
        }

        return toResult(
            JSON.stringify({
                success: true,
                liquidity: liquidityResults,
            }),
        );
    } catch (error) {
        console.error('Error in getSwapsLiquidity:', error);
        return toResult(`Failed to get swap liquidity on ${networkName}: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
    }
}

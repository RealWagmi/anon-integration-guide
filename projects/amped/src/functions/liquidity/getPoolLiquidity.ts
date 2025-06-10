import { formatUnits, Address, PublicClient, zeroAddress } from 'viem';
// Import types from the SDK package
import { FunctionReturn, FunctionOptions, toResult } from '@heyanon/sdk';
import { CONTRACT_ADDRESSES } from '../../constants.js';
// Import new token utilities
import { getChainFromName, getSupportedTokens, type TokenSymbol, getTokenAddress } from '../../utils.js';
import { VaultPriceFeed } from '../../abis/VaultPriceFeed.js';

// Use keys of NETWORKS directly for the chain name type
// type SupportedChainName = keyof typeof NETWORKS;

interface Props {
    chainName: string;
    publicClient: PublicClient;
}

interface TokenLiquidity {
    symbol: string;
    address: string;
    poolAmount: string;
    reservedAmount: string;
    availableAmount: string;
    price: string;
    poolAmountUsd: string;
    reservedAmountUsd: string;
    availableAmountUsd: string;
    // Deposit capacity information
    depositCapacity: {
        // Theoretical maximum that could be deposited without constraints
        theoreticalMax: string;
        theoreticalMaxUsd: string;
        // Pool utilization percentage (reserved/pool * 100)
        utilizationPercent: string;
        // Whether deposits are currently possible
        canDeposit: boolean;
        // Estimated price impact for different deposit sizes
        priceImpactEstimates: {
            small: string;  // $1,000 worth
            medium: string; // $10,000 worth
            large: string;  // $100,000 worth
        };
    };
}

interface PoolLiquidity {
    aum: string;
    totalCapacityUsd: string;
    totalUtilizationPercent: string;
    tokens: TokenLiquidity[];
}

// Define the specific ABI for the functions we need
const GLP_MANAGER_ABI = [
    {
        inputs: [{ type: 'bool', name: 'maximise' }],
        name: 'getAum',
        outputs: [{ type: 'uint256', name: '' }],
        stateMutability: 'view',
        type: 'function',
    },
] as const;

const VAULT_ABI = [
    {
        inputs: [{ name: '_token', type: 'address' }],
        name: 'poolAmounts',
        outputs: [{ type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ name: '_token', type: 'address' }],
        name: 'reservedAmounts',
        outputs: [{ type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ name: '_token', type: 'address' }],
        name: 'getMinPrice',
        outputs: [{ type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
] as const;

/**
 * Gets the total liquidity pool (ALP/GLP) supply, Assets Under Management (AUM), and deposit capacity information
 * @param props - The function parameters
 * @param props.chainName - The name of the chain (sonic or base)
 * @param props.publicClient - Viem Public Client for blockchain interaction
 * @param options - System tools (only notify is used)
 * @returns Pool information including total supply, AUM, individual token liquidity, and deposit capacity for each token
 */
export async function getPoolLiquidity(props: Props, options: FunctionOptions): Promise<FunctionReturn> {
    const { chainName, publicClient } = props;
    const { notify } = options;

    // Validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) {
        return toResult(`Network ${chainName} not supported`, true);
    }
    // const networkName = chainName.toLowerCase(); // No longer needed, chainName is already lowercase
    const networkContracts = CONTRACT_ADDRESSES[chainId];


    try {
        // Get AUM (Assets Under Management)
        const aum = await publicClient.readContract({
            address: networkContracts.GLP_MANAGER,
            abi: GLP_MANAGER_ABI,
            functionName: 'getAum',
            args: [true], // Include pending changes
        }) as bigint;

        // Define supported tokens for Vault interaction using getSupportedTokens and adjusting native tokens
        const allChainTokens = getSupportedTokens(chainName);
        const supportedTokensForVault: { symbol: TokenSymbol; address: Address; decimals: number }[] = [];

        // Define which symbols are relevant for GLP/ALP pools for each chain
        // These are the tokens whose liquidity is tracked in the Vault for GLP composition.
        const poolConstituentSymbols: Record<string, TokenSymbol[]> = {
            sonic: ['S', 'WETH', 'Anon', 'USDC', 'STS', 'scUSD'],
            base: ['ETH', 'WETH', 'CBBTC', 'USDC', 'VIRTUAL'],
        };

        const relevantSymbols = poolConstituentSymbols[chainName] || [];

        for (const token of allChainTokens) {
            if (!relevantSymbols.includes(token.symbol)) {
                continue; // Skip tokens not part of GLP/ALP composition for this network
            }

            let addressForVaultCall = token.address;
            let displaySymbol = token.symbol;

            // If the token is native 'S' or 'ETH', use its wrapped address for Vault calls
            // but keep the display symbol as 'S' or 'ETH'.
            if (chainName === 'sonic' && token.symbol === 'S') {
                if (networkContracts.WRAPPED_NATIVE_TOKEN) {
                    addressForVaultCall = networkContracts.WRAPPED_NATIVE_TOKEN;
                }
                displaySymbol = 'S'; // Ensure display symbol is native
            } else if (chainName === 'base' && token.symbol === 'ETH') {
                if (networkContracts.WRAPPED_NATIVE_TOKEN) {
                    addressForVaultCall = networkContracts.WRAPPED_NATIVE_TOKEN;
                }
                displaySymbol = 'ETH'; // Ensure display symbol is native
            }

            if (addressForVaultCall && addressForVaultCall !== zeroAddress) {
                supportedTokensForVault.push({
                    symbol: displaySymbol, // Use the original native symbol for display
                    address: addressForVaultCall,
                    decimals: token.decimals, // Decimals from tokenList.ts
                });
            }
        }

        // Filter out any tokens where the address might be effectively zero or missing (already done by check above)
        // supportedTokensForVault = supportedTokensForVault.filter(t => !!t.address && t.address !== zeroAddress);


        // Get liquidity info for each token using publicClient
        const tokenLiquidityPromises = supportedTokensForVault.map(async (token) => {
             // Handle potential errors for individual tokens
             try {
                const [poolAmount, reservedAmount, price] = await Promise.all([
                    publicClient.readContract({
                        address: networkContracts.VAULT,
                        abi: VAULT_ABI,
                        functionName: 'poolAmounts',
                        args: [token.address],
                    }) as Promise<bigint>,
                    publicClient.readContract({
                        address: networkContracts.VAULT,
                        abi: VAULT_ABI,
                        functionName: 'reservedAmounts',
                        args: [token.address],
                    }) as Promise<bigint>,
                    publicClient.readContract({
                        address: networkContracts.VAULT_PRICE_FEED,
                        abi: VaultPriceFeed,
                        functionName: 'getPrice',
                        args: [token.address, false, true, false],
                    }) as Promise<bigint>,
                ]);

                const availableAmount = poolAmount - reservedAmount;
                const poolAmountUsd = (poolAmount * price) / BigInt(10 ** token.decimals);
                const reservedAmountUsd = (reservedAmount * price) / BigInt(10 ** token.decimals);
                const availableAmountUsd = (availableAmount * price) / BigInt(10 ** token.decimals);

                // Calculate deposit capacity metrics
                const utilizationPercent = poolAmount > 0n 
                    ? Number((reservedAmount * 10000n) / poolAmount) / 100 
                    : 0;

                // Theoretical max deposit - using a conservative 5x multiplier of current pool amount
                // This prevents extreme pool imbalances
                const theoreticalMax = poolAmount * 5n;
                const theoreticalMaxUsd = (theoreticalMax * price) / BigInt(10 ** token.decimals);

                // Check if deposits are possible (pool has some liquidity and not over-utilized)
                const canDeposit = poolAmount > 0n && utilizationPercent < 95;

                // Estimate price impact for different deposit sizes
                // These are rough estimates - actual impact depends on AMM curve
                const estimatePriceImpact = (depositUsd: bigint): string => {
                    if (poolAmountUsd === 0n) return "N/A";
                    
                    // Simple linear approximation: impact = depositSize / (poolSize * factor)
                    // factor = 50 means 2% impact for deposit equal to pool size
                    const factor = 50n;
                    const impactBasisPoints = (depositUsd * 10000n) / (poolAmountUsd * factor);
                    return (Number(impactBasisPoints) / 100).toFixed(2);
                };

                // Calculate price impacts for standard sizes
                const smallDepositUsd = BigInt(1000) * BigInt(10 ** 30); // $1,000
                const mediumDepositUsd = BigInt(10000) * BigInt(10 ** 30); // $10,000
                const largeDepositUsd = BigInt(100000) * BigInt(10 ** 30); // $100,000

                return {
                    symbol: token.symbol, // This is now correctly the display symbol (e.g., 'S')
                    address: token.address, // This is the address used for vault calls (e.g., Wrapped Sonic address)
                    poolAmount: formatUnits(poolAmount, token.decimals),
                    reservedAmount: formatUnits(reservedAmount, token.decimals),
                    availableAmount: formatUnits(availableAmount, token.decimals),
                    price: formatUnits(price, 30),
                    poolAmountUsd: formatUnits(poolAmountUsd, 30),
                    reservedAmountUsd: formatUnits(reservedAmountUsd, 30),
                    availableAmountUsd: formatUnits(availableAmountUsd, 30),
                    depositCapacity: {
                        theoreticalMax: formatUnits(theoreticalMax, token.decimals),
                        theoreticalMaxUsd: formatUnits(theoreticalMaxUsd, 30),
                        utilizationPercent: utilizationPercent.toFixed(2),
                        canDeposit,
                        priceImpactEstimates: {
                            small: estimatePriceImpact(smallDepositUsd) + "%",
                            medium: estimatePriceImpact(mediumDepositUsd) + "%",
                            large: estimatePriceImpact(largeDepositUsd) + "%",
                        },
                    },
                };
            } catch (tokenError: any) {
                 return null; // Return null for failed tokens
             }
        });
        
        const tokenLiquidityResults = await Promise.all(tokenLiquidityPromises);
        const tokenLiquidity = tokenLiquidityResults.filter(t => t !== null) as TokenLiquidity[]; // Filter out nulls

        // Format AUM
        const aumFormatted = formatUnits(aum, 30);

        // Calculate total capacity metrics
        let totalPoolAmountUsd = 0;
        let totalReservedAmountUsd = 0;
        
        tokenLiquidity.forEach(token => {
            totalPoolAmountUsd += parseFloat(token.poolAmountUsd);
            totalReservedAmountUsd += parseFloat(token.reservedAmountUsd);
        });
        
        const totalUtilizationPercent = totalPoolAmountUsd > 0 
            ? (totalReservedAmountUsd / totalPoolAmountUsd * 100).toFixed(2)
            : "0.00";

        const poolLiquidity: PoolLiquidity = {
            aum: aumFormatted,
            totalCapacityUsd: totalPoolAmountUsd.toFixed(2),
            totalUtilizationPercent,
            tokens: tokenLiquidity,
        };

        // Stringify the result to match toResult expectation
        return toResult(JSON.stringify(poolLiquidity)); 
        
    } catch (error: any) {
        return toResult(`Failed to fetch pool liquidity: ${error.message}`, true);
    }
}

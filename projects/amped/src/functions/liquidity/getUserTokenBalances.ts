import { Address, createPublicClient, http, Chain, type PublicClient } from 'viem';
import { FunctionReturn, FunctionOptions, toResult } from '@heyanon/sdk';
import { CONTRACT_ADDRESSES, SupportedNetwork, CHAIN_CONFIG } from '../../constants.js';
import { ERC20 } from '../../abis/ERC20.js';
import { VaultPriceFeed } from '../../abis/VaultPriceFeed.js';
import { getChainFromName, getTokenAddress, getSupportedTokens, getTokenDecimals } from '../../utils.js';
import { formatUnits } from 'viem';

interface Props {
    chainName: 'sonic' | 'base';
    account: Address;
    publicClient?: PublicClient;
}

interface TokenInfo {
    symbol: string;
    address: Address;
    decimals: number;
    balance: string;
    balanceUsd: string;
    price: string;
}

// Helper function for safe string conversion
function safeToString(value: unknown): string {
    if (value === null || value === undefined) return '';
    return String(value);
}

// Helper function for safe number conversion
function safeToNumber(value: unknown): number {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'string') {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : parsed;
    }
    if (typeof value === 'number') return isNaN(value) ? 0 : value;
    if (typeof value === 'bigint') {
        try {
            return Number(value);
        } catch {
            return 0;
        }
    }
    return 0;
}

/**
 * Gets balances and USD values of all supported tokens on Amped Finance for a given network
 * @param props - The function parameters
 * @param props.chainName - The name of the chain (sonic or base)
 * @param props.account - The account address to check balances for
 * @param props.publicClient - Viem Public Client for interacting with the blockchain (optional)
 * @param options - System tools (like notify)
 * @returns Information about token balances and their USD values
 */
export async function getUserTokenBalances(
    { chainName, account, publicClient }: Props,
    options: FunctionOptions
): Promise<FunctionReturn> {
    // Validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) {
        return toResult(`Network ${chainName} not supported`, true);
    }

    // Use lowercase network name for accessing CONTRACT_ADDRESSES keys
    const networkName = chainName.toLowerCase(); 
    const networkContracts = CONTRACT_ADDRESSES[chainId]; 
    
    // Also use lowercase name for network-specific logic checks
    const network = networkName as SupportedNetwork; 

    // Check if contracts for the network exist
    if (!networkContracts) {
        return toResult(`Contract addresses not found for network: ${networkName}`, true);
    }

    // Check wallet connection
    if (!account) {
        return toResult('Wallet not connected', true);
    }

    // Use publicClient from props if provided, otherwise get it from options
    const client = publicClient || options.getProvider(chainId);
    
    // Validate client
    if (!client) {
        return toResult('Failed to get a valid provider for the blockchain', true);
    }

    try {
        await options.notify(`Fetching token balances on ${networkName}...`);

        const tokenInfos: TokenInfo[] = [];

        // Get supported tokens from SDK
        const supportedTokens = getSupportedTokens(networkName);
        
        // Define network-specific details
        let nativeSymbol: string;
        let wrappedNativeSymbol: string;
        
        if (networkName === 'sonic') {
            nativeSymbol = 'S';
            wrappedNativeSymbol = 'WS';
        } else if (networkName === 'base') {
            nativeSymbol = 'ETH';
            wrappedNativeSymbol = 'WETH';
        } else {
            return toResult(`Logic not implemented for network: ${networkName}`, true);
        }
        
        // Build token list using SDK utilities
        const acceptedErc20Tokens: { symbol: string; address: Address; decimals: number }[] = [];
        for (const symbol of supportedTokens) {
            // Skip native tokens as they're handled separately
            if (symbol === nativeSymbol || symbol === wrappedNativeSymbol) continue;
            
            try {
                const address = getTokenAddress(symbol, networkName);
                const decimals = getTokenDecimals(symbol, networkName);
                acceptedErc20Tokens.push({ symbol, address, decimals });
            } catch (e) {
                // Skip tokens that can't be resolved
                continue;
            }
        }
        
        const nativeTokenAddress = networkContracts.NATIVE_TOKEN;
        const wrappedNativeTokenAddress = networkContracts.WRAPPED_NATIVE_TOKEN;
        const vaultPriceFeedAddress = networkContracts.VAULT_PRICE_FEED;
        
        // Validate required addresses
        if (!nativeTokenAddress || !wrappedNativeTokenAddress || !vaultPriceFeedAddress) {
             return toResult(`Core contract addresses missing for network ${network}`, true);
        }

        // --- Native Token Balance & Price ---
        try {
            const nativeBalanceBigInt = await client.getBalance({ address: account });

            const nativePrice = await client.readContract({
                address: vaultPriceFeedAddress,
                abi: VaultPriceFeed,
                functionName: 'getPrice',
                args: [wrappedNativeTokenAddress, false, true, false],
            }) as bigint;

            // Price is in 1e30, balance in 1e18, result should be in USD (1e30)
            const nativeBalanceUsd = (nativeBalanceBigInt * nativePrice) / BigInt(1e18);

            tokenInfos.push({
                symbol: nativeSymbol,
                address: nativeTokenAddress, // Use generic NATIVE_TOKEN address (e.g., 0xeee)
                decimals: 18,
                balance: formatUnits(nativeBalanceBigInt, 18),
                balanceUsd: formatUnits(nativeBalanceUsd, 30),
                price: formatUnits(nativePrice, 30),
            });

            // --- Wrapped Native Token Balance (uses same price) ---
            const wrappedBalance = await client.readContract({
                address: wrappedNativeTokenAddress,
                abi: ERC20,
                functionName: 'balanceOf',
                args: [account],
            }) as bigint;
            const wrappedBalanceUsd = (wrappedBalance * nativePrice) / BigInt(1e18);

            tokenInfos.push({
                symbol: wrappedNativeSymbol,
                address: wrappedNativeTokenAddress,
                decimals: 18,
                balance: formatUnits(wrappedBalance, 18),
                balanceUsd: formatUnits(wrappedBalanceUsd, 30),
                price: formatUnits(nativePrice, 30),
            });

        } catch (error) {
            return toResult(`Failed to get native/wrapped balances on ${network}: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
        }

        // --- ERC20 Token Balances & Prices ---
        const tokenDataPromises = acceptedErc20Tokens.map(async (token) => {
             const balancePromise = client.readContract({
                    address: token.address,
                    abi: ERC20,
                    functionName: 'balanceOf',
                    args: [account],
                }) as Promise<bigint>;
             
             const pricePromise = client.readContract({
                    address: vaultPriceFeedAddress, // Use network-specific price feed
                    abi: VaultPriceFeed,
                    functionName: 'getPrice',
                    args: [token.address, false, true, false],
                }) as Promise<bigint>;
                
             // Process results
             const [balance, price] = await Promise.all([balancePromise, pricePromise]);
 
             // Price is in 1e30, balance in token decimals, result should be in USD (1e30)
             const balanceUsd = (balance * price) / BigInt(10 ** token.decimals);
 
             return {
                 symbol: token.symbol,
                 address: token.address,
                 decimals: token.decimals,
                 balance: formatUnits(balance, token.decimals),
                 balanceUsd: formatUnits(balanceUsd, 30),
                 price: formatUnits(price, 30),
             };
        });

        // Wait for all token data to be fetched
        const tokenResults = await Promise.all(tokenDataPromises);
        tokenInfos.push(...tokenResults);

        // Calculate total balance in USD
        const totalBalanceUsd = tokenInfos.reduce((sum, token) => {
            // Ensure balanceUsd is treated as a number
            return sum + safeToNumber(token.balanceUsd); 
        }, 0);

        return toResult(
            JSON.stringify({
                tokens: tokenInfos,
                totalBalanceUsd: totalBalanceUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            }),
        );
    } catch (error) {
        return toResult(`Failed to get token balances on ${network}: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
    }
}

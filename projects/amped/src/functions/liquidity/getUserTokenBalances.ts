import { Address, createPublicClient, http, Chain, type PublicClient } from 'viem';
import { FunctionReturn, FunctionOptions, toResult } from '@heyanon/sdk';
import { CONTRACT_ADDRESSES, NETWORKS, SupportedNetwork, CHAIN_CONFIG } from '../../constants.js';
import { ERC20 } from '../../abis/ERC20.js';
import { VaultPriceFeed } from '../../abis/VaultPriceFeed.js';
import { getChainFromName, getTokenAddress } from '../../utils.js';
import { formatUnits } from 'viem';

interface Props {
    chainName: (typeof NETWORKS)[keyof typeof NETWORKS];
    account: Address;
    publicClient: PublicClient;
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
 * @param props.publicClient - Viem Public Client for interacting with the blockchain
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
    const networkContracts = CONTRACT_ADDRESSES[networkName]; 
    
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

    // Validate publicClient
    if (!publicClient) {
        return toResult('Public client not provided', true);
    }

    try {
        await options.notify(`Fetching token balances on ${networkName}...`);

        const tokenInfos: TokenInfo[] = [];

        // Define network-specific token details
        let nativeSymbol: string;
        let wrappedNativeSymbol: string;
        let acceptedErc20Tokens: { symbol: string; address: Address; decimals: number }[];

        // Compare lowercase networkName with the VALUES from NETWORKS (which are lowercase strings)
        if (networkName === NETWORKS.SONIC) { // Use uppercase key NETWORKS.SONIC (value is 'sonic')
            nativeSymbol = 'S';
            wrappedNativeSymbol = 'WS';
            acceptedErc20Tokens = [
                { symbol: 'WETH', address: networkContracts.WETH, decimals: 18 },
                { symbol: 'ANON', address: networkContracts.ANON, decimals: 18 },
                { symbol: 'USDC', address: networkContracts.USDC, decimals: 6 },
            ];
        } else if (networkName === NETWORKS.BASE) { // Use uppercase key NETWORKS.BASE (value is 'base')
            nativeSymbol = 'ETH';
            wrappedNativeSymbol = 'WETH';
            acceptedErc20Tokens = [
                { symbol: 'CBBTC', address: networkContracts.CBBTC, decimals: 18 }, 
                { symbol: 'USDC', address: networkContracts.USDC, decimals: 6 },
                { symbol: 'VIRTUAL', address: networkContracts.VIRTUAL, decimals: 18 }, 
            ];
        } else {
            // Handle case where networkName might be valid but not SONIC or BASE explicitly
            return toResult(`Logic not implemented for network: ${networkName}`, true);
        }
        
        const nativeTokenAddress = networkContracts.NATIVE_TOKEN;
        const wrappedNativeTokenAddress = networkContracts.WRAPPED_NATIVE_TOKEN;
        const vaultPriceFeedAddress = networkContracts.VAULT_PRICE_FEED;
        
        // Validate required addresses
        if (!nativeTokenAddress || !wrappedNativeTokenAddress || !vaultPriceFeedAddress) {
             return toResult(`Core contract addresses missing for network ${network}`, true);
        }

        await options.notify(`Using Price Feed: ${vaultPriceFeedAddress}`);

        // --- Native Token Balance & Price ---
        try {
            await options.notify(`Fetching ${nativeSymbol} balance...`);
            const nativeBalanceBigInt = await publicClient.getBalance({ address: account });
            await options.notify(`Raw ${nativeSymbol} balance: ${nativeBalanceBigInt.toString()}`);

            await options.notify(`Fetching ${wrappedNativeSymbol} price (used for ${nativeSymbol})...`);
            const nativePrice = await publicClient.readContract({
                address: vaultPriceFeedAddress,
                abi: VaultPriceFeed,
                functionName: 'getPrice',
                args: [wrappedNativeTokenAddress, false, true, false],
            }) as bigint;
            await options.notify(`${wrappedNativeSymbol} price from Amped: ${nativePrice.toString()} (raw)`);

            // Price is in 1e30, balance in 1e18, result should be in USD (1e30)
            const nativeBalanceUsd = (nativeBalanceBigInt * nativePrice) / BigInt(1e18);
            await options.notify(`${nativeSymbol} balance USD: ${formatUnits(nativeBalanceUsd, 30)}`);

            tokenInfos.push({
                symbol: nativeSymbol,
                address: nativeTokenAddress, // Use generic NATIVE_TOKEN address (e.g., 0xeee)
                decimals: 18,
                balance: formatUnits(nativeBalanceBigInt, 18),
                balanceUsd: formatUnits(nativeBalanceUsd, 30),
                price: formatUnits(nativePrice, 30),
            });

            // --- Wrapped Native Token Balance (uses same price) ---
            await options.notify(`Fetching ${wrappedNativeSymbol} balance...`);
            const wrappedBalance = await publicClient.readContract({
                address: wrappedNativeTokenAddress,
                abi: ERC20,
                functionName: 'balanceOf',
                args: [account],
            }) as bigint;
            const wrappedBalanceUsd = (wrappedBalance * nativePrice) / BigInt(1e18);
            await options.notify(`${wrappedNativeSymbol} balance USD: ${formatUnits(wrappedBalanceUsd, 30)}`);

            tokenInfos.push({
                symbol: wrappedNativeSymbol,
                address: wrappedNativeTokenAddress,
                decimals: 18,
                balance: formatUnits(wrappedBalance, 18),
                balanceUsd: formatUnits(wrappedBalanceUsd, 30),
                price: formatUnits(nativePrice, 30),
            });

        } catch (error) {
            console.error('Error fetching native/wrapped balances:', error);
            return toResult(`Failed to get native/wrapped balances on ${network}: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
        }

        // --- ERC20 Token Balances & Prices ---
        await options.notify(`Fetching ERC20 balances for: ${acceptedErc20Tokens.map(t => t.symbol).join(', ')}...`);
        const tokenDataPromises = acceptedErc20Tokens.map(async (token) => {
             await options.notify(`- Fetching balance for ${token.symbol} (${token.address})`);
             const balancePromise = publicClient.readContract({
                    address: token.address,
                    abi: ERC20,
                    functionName: 'balanceOf',
                    args: [account],
                }) as Promise<bigint>;
             
             await options.notify(`- Fetching price for ${token.symbol}`);
             const pricePromise = publicClient.readContract({
                    address: vaultPriceFeedAddress, // Use network-specific price feed
                    abi: VaultPriceFeed,
                    functionName: 'getPrice',
                    args: [token.address, false, true, false],
                }) as Promise<bigint>;

            const [balance, price] = await Promise.all([balancePromise, pricePromise]);
            await options.notify(`- ${token.symbol} Raw Balance: ${balance.toString()}, Raw Price: ${price.toString()}`);

            // Price is in 1e30, balance in token decimals, result should be in USD (1e30)
            const balanceUsd = (balance * price) / BigInt(10 ** token.decimals);
            await options.notify(`- ${token.symbol} Balance USD: ${formatUnits(balanceUsd, 30)}`);

            return {
                ...token,
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

        await options.notify(`Total wallet balance: $${totalBalanceUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);

        return toResult(
            JSON.stringify({
                tokens: tokenInfos,
                totalBalanceUsd: totalBalanceUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            }),
        );
    } catch (error) {
        console.error('Error in getUserTokenBalances:', error);
        return toResult(`Failed to get token balances on ${network}: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
    }
}

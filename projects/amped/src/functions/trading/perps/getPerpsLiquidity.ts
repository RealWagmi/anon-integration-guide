import { type Address, type PublicClient } from 'viem';
import { FunctionReturn, FunctionOptions, toResult } from '@heyanon/sdk';
import { CONTRACT_ADDRESSES, NETWORKS } from '../../../constants.js';
import { getChainFromName } from '../../../utils.js';
import { getTokenAddress, type TokenSymbol } from '../../../utils/tokenList.js';
import { Vault } from '../../../abis/Vault.js';
import { VaultPriceFeed } from '../../../abis/VaultPriceFeed.js';

interface Props {
    chainName: (typeof NETWORKS)[keyof typeof NETWORKS];
    account: Address;
    indexToken: TokenSymbol;
    isLong: boolean;
    publicClient?: PublicClient;
}

/**
 * Gets information about liquidity available for perpetual trading
 * @param props - The function parameters
 * @param props.chainName - The name of the chain (sonic or base)
 * @param props.account - The account address (passed for context, not directly used in logic)
 * @param props.indexToken - Symbol of the token to trade
 * @param props.isLong - Whether this is for a long position (true) or short position (false)
 * @param props.publicClient - Viem Public Client for interacting with the blockchain (optional)
 * @param options - System tools (like notify)
 * @returns Information about available liquidity for the specified token position
 */
export async function getPerpsLiquidity(
    { chainName, account, indexToken, isLong, publicClient }: Props,
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
    
    // Convert token symbol to address
    let tokenAddress: Address;
    try {
        tokenAddress = getTokenAddress(indexToken, networkName);
    } catch (error) {
        return toResult(`Token ${indexToken} not supported on ${networkName}: ${error.message}`, true);
    }
    
    // Use publicClient from props if provided, otherwise get it from options
    const client = publicClient || getProvider(chainId);
    
    // Validate client
    if (!client) {
        return toResult('Failed to get a valid provider for the blockchain', true);
    }
    
    try {
        await notify(`Checking perpetual trading liquidity information...`);
        await notify(`Fetching token price...`);
        
        // Get token price from VaultPriceFeed
        const tokenPrice = await client.readContract({
            address: networkContracts.VAULT_PRICE_FEED,
            abi: VaultPriceFeed,
            functionName: 'getPrice',
            args: [tokenAddress, false, true, false],
        }) as bigint;
        
        await notify(`Fetching pool information...`);
        
        // Get pool and reserved amounts from Vault
        const poolAmount = await client.readContract({
            address: networkContracts.VAULT,
            abi: Vault,
            functionName: 'poolAmounts',
            args: [tokenAddress],
        }) as bigint;
        
        const reservedAmount = await client.readContract({
            address: networkContracts.VAULT,
            abi: Vault,
            functionName: 'reservedAmounts',
            args: [tokenAddress],
        }) as bigint;
        
        // Calculate available liquidity
        const availableAmount = poolAmount - reservedAmount;
        
        // Calculate USD values (respecting decimal places)
        // These are approximations and should be formatted properly for display
        const baseDecimals = BigInt(1e18); // Assuming 18 decimals for the base tokens
        const tokenDecimals = baseDecimals; // Most tokens are 18 decimals
        const priceDecimals = BigInt(1e30); // Amped Finance price feed uses 30 decimals
        
        // Calculate USD values
        const poolAmountUsd = (poolAmount * tokenPrice) / tokenDecimals;
        const reservedAmountUsd = (reservedAmount * tokenPrice) / tokenDecimals;
        const availableAmountUsd = (availableAmount * tokenPrice) / tokenDecimals;
        
        // Format human-readable values for logging
        const scaleFactor = BigInt(1e18); // Move decimal point for display
        await notify(`Raw calculations:`);
        await notify(`Pool Amount: ${poolAmount} wei`);
        await notify(`Reserved Amount: ${reservedAmount} wei`);
        await notify(`Available Liquidity: ${availableAmount} wei`);
        await notify(`Price Response: ${tokenPrice} (1e30)`);
        await notify(`Pool Amount USD calculation: ${poolAmount} * ${tokenPrice} / 1e48 = ${poolAmountUsd / scaleFactor}`);
        await notify(`Reserved Amount USD calculation: ${reservedAmount} * ${tokenPrice} / 1e48 = ${reservedAmountUsd / scaleFactor}`);
        await notify(`Available Liquidity USD calculation: ${availableAmount} * ${tokenPrice} / 1e48 = ${availableAmountUsd / scaleFactor}`);
        
        // Format the outputs for display (simple division to get readable values)
        const formattedPoolAmount = Number(poolAmount) / Number(baseDecimals);
        const formattedReservedAmount = Number(reservedAmount) / Number(baseDecimals);
        const formattedAvailableAmount = Number(availableAmount) / Number(baseDecimals);
        const formattedPriceUsd = Number(tokenPrice) / Number(priceDecimals);
        const formattedPoolAmountUsd = Math.round(Number(poolAmountUsd) / Number(priceDecimals));
        const formattedReservedAmountUsd = Math.round(Number(reservedAmountUsd) / Number(priceDecimals));
        const formattedAvailableAmountUsd = Math.round(Number(availableAmountUsd) / Number(priceDecimals));
        
        await notify(`Pool Amount: ${formattedPoolAmount} tokens ($${formattedPoolAmountUsd})`);
        await notify(`Reserved Amount: ${formattedReservedAmount} tokens ($${formattedReservedAmountUsd})`);
        await notify(`Available Liquidity: ${formattedAvailableAmount} tokens ($${formattedAvailableAmountUsd})`);
        
        return toResult(JSON.stringify({
            success: true,
            info: {
                maxLeverage: "50", // Hardcoded as it's fixed in the protocol
                poolAmount: formattedPoolAmount.toString(),
                poolAmountUsd: formattedPoolAmountUsd.toString(),
                reservedAmount: formattedReservedAmount.toString(),
                reservedAmountUsd: formattedReservedAmountUsd.toString(),
                availableLiquidity: formattedAvailableAmount.toString(),
                availableLiquidityUsd: formattedAvailableAmountUsd.toString(),
                fundingRate: "0", // Not implemented in this simple version
                priceUsd: formattedPriceUsd.toString(),
            }
        }));
    } catch (error) {
        console.error('Error in getPerpsLiquidity:', error);
        return toResult(`Failed to get perps liquidity on ${networkName}: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
    }
} 
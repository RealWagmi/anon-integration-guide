import { Address, isAddress, formatUnits } from 'viem';
import { FunctionReturn, FunctionOptions, toResult } from '@heyanon/sdk';
import { CONTRACT_ADDRESSES } from '../../../constants.js';
import { Vault } from '../../../abis/Vault.js';
import { VaultPriceFeed } from '../../../abis/VaultPriceFeed.js';
import { getTokenAddress, getTokenDecimals, type TokenSymbol } from '../../../utils.js';
import { getChainFromName } from '../../../utils.js';

interface Props {
    chainName: 'sonic' | 'base';
    account: Address;
    tokenSymbol: TokenSymbol;
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
 * @param props.tokenSymbol - The token to trade (e.g., WETH, ANON)
 * @param props.isLong - Whether this is for a long position
 * @param options - System tools for blockchain interactions
 * @returns Information about token liquidity and trading parameters
 */
export async function getPerpsLiquidity({ chainName, account, tokenSymbol, isLong }: Props, options: FunctionOptions): Promise<FunctionReturn> {
    // Validate chain and get chainId
    const chainId = getChainFromName(chainName);
    if (!chainId) {
        return toResult(`Network ${chainName} not supported`, true);
    }

    const networkName = chainName.toLowerCase();
    const networkContracts = CONTRACT_ADDRESSES[chainId];

    if (!networkContracts || !networkContracts.VAULT || !networkContracts.VAULT_PRICE_FEED) {
        return toResult(`Core contract addresses (VAULT, VAULT_PRICE_FEED) not found for network: ${networkName}`, true);
    }

    let tokenAddressForContractCall: Address;
    let tokenDecimalsValue: number;
    let displaySymbol: TokenSymbol = tokenSymbol; // Keep the original symbol for display and messages

    // Define allowed tokens based on chain and isLong
    const allowedTokens: Partial<Record<TokenSymbol, boolean>> = {};
    if (networkName === 'sonic') {
        if (isLong) {
            allowedTokens['WETH'] = true;
            allowedTokens['Anon'] = true;
            allowedTokens['S'] = true;
            allowedTokens['STS'] = true;
        } else { // Short
            allowedTokens['USDC'] = true;
            allowedTokens['scUSD'] = true;
        }
    } else if (networkName === 'base') {
        if (isLong) {
            allowedTokens['ETH'] = true;
            allowedTokens['CBBTC'] = true;
        } else { // Short
            allowedTokens['USDC'] = true;
        }
    }

    if (!allowedTokens[tokenSymbol]) {
        return toResult(`Token ${tokenSymbol} is not supported for the specified position type (long/short) on ${networkName}.`, true);
    }

    try {
        // Initial resolution for decimals and basic address.
        // The actual address used for contract calls might be overridden for native tokens.
        let preliminaryAddress = getTokenAddress(tokenSymbol, networkName);
        tokenDecimalsValue = getTokenDecimals(tokenSymbol, networkName);

        // Determine the correct address for Vault operations (especially for native tokens)
        if (networkName === 'sonic' && tokenSymbol === 'S') {
            if (!networkContracts.WRAPPED_NATIVE_TOKEN) {
                return toResult('Wrapped native token (WS) address not found for Sonic chain.', true);
            }
            tokenAddressForContractCall = networkContracts.WRAPPED_NATIVE_TOKEN;
            displaySymbol = 'S'; // Ensure display symbol remains native
        } else if (networkName === 'base' && tokenSymbol === 'ETH') {
            if (!networkContracts.WRAPPED_NATIVE_TOKEN) {
                return toResult('Wrapped native token (WETH) address not found for Base chain.', true);
            }
            tokenAddressForContractCall = networkContracts.WRAPPED_NATIVE_TOKEN;
            displaySymbol = 'ETH'; // Ensure display symbol remains native
        } else {
            tokenAddressForContractCall = preliminaryAddress; // Use the directly resolved address for other ERC20s
        }

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return toResult(`Token ${displaySymbol} not supported on ${networkName}: ${errorMessage}`, true);
    }

    // Validate addresses (account is already Address type)
    if (!isAddress(account) || account === '0x0000000000000000000000000000000000000000') {
        return toResult('Invalid account address provided', true);
    }
    // tokenAddressForContractCall is validated by getTokenAddress, which throws if not found/valid

    await options.notify(`Checking perpetual trading liquidity for ${displaySymbol}...`);

    // Use getProvider from FunctionOptions
    const provider = options.getProvider(chainId);
    if (!provider) {
        return toResult('EVM provider not available. This function requires an EVM provider.', true);
    }

    try {
        // Get token price first to validate token is supported
        const priceResponse = await provider.readContract({
            address: networkContracts.VAULT_PRICE_FEED,
            abi: VaultPriceFeed,
            functionName: 'getPrice',
            args: [tokenAddressForContractCall, false, true, false], // Use the (potentially wrapped) address
        }) as bigint;

        if (priceResponse === 0n) {
            return toResult(`No price feed available for ${displaySymbol} (${tokenAddressForContractCall}) on ${networkName}`, true);
        }

        // Get pool and reserved amounts
        const [poolAmount, reservedAmount] = await Promise.all([
            provider.readContract({
                address: networkContracts.VAULT,
                abi: Vault,
                functionName: 'poolAmounts',
                args: [tokenAddressForContractCall],
            }) as Promise<bigint>,
            provider.readContract({
                address: networkContracts.VAULT,
                abi: Vault,
                functionName: 'reservedAmounts',
                args: [tokenAddressForContractCall],
            }) as Promise<bigint>,
        ]);

        const availableLiquidity = poolAmount - reservedAmount;

        // Calculate USD values using tokenDecimalsValue
        const divisorForUsd = BigInt(10 ** (tokenDecimalsValue + 30));

        const poolAmountUsd = (poolAmount * priceResponse) / divisorForUsd;
        const reservedAmountUsd = (reservedAmount * priceResponse) / divisorForUsd;
        const availableLiquidityUsd = (availableLiquidity * priceResponse) / divisorForUsd;

        const liquidityInfo: LiquidityInfo = {
            maxLeverage: '50',
            poolAmount: formatUnits(poolAmount, tokenDecimalsValue),
            poolAmountUsd: formatUnits(poolAmountUsd, 0), // USD values are now effectively in USD units (no decimals)
            reservedAmount: formatUnits(reservedAmount, tokenDecimalsValue),
            reservedAmountUsd: formatUnits(reservedAmountUsd, 0),
            availableLiquidity: formatUnits(availableLiquidity, tokenDecimalsValue),
            availableLiquidityUsd: formatUnits(availableLiquidityUsd, 0),
            fundingRate: '0',
            priceUsd: formatUnits(priceResponse, 30),
        };

        const response: LiquidityResponse = {
            success: true,
            info: liquidityInfo,
        };

        return toResult(JSON.stringify(response));
    } catch (error) {
        if (error instanceof Error) {
            return toResult(`Failed to get perpetual trading liquidity for ${displaySymbol} on ${networkName}: ${error.message}`, true);
        }
        return toResult(`Failed to get perpetual trading liquidity for ${displaySymbol} on ${networkName}: Unknown error`, true);
    }
}

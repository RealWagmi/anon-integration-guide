import { Address, isAddress, formatUnits } from 'viem';
import { FunctionReturn, FunctionOptions, toResult } from '@heyanon/sdk';
import { CONTRACT_ADDRESSES, NETWORKS } from '../../../constants.js';
import { Vault } from '../../../abis/Vault.js';
import { VaultPriceFeed } from '../../../abis/VaultPriceFeed.js';
import { getTokenAddress, getTokenDecimals, type TokenSymbol } from '../../../utils.js';
import { getChainFromName } from '../../../utils.js';

interface Props {
    chainName: (typeof NETWORKS)[keyof typeof NETWORKS];
    account: Address;
    indexToken: TokenSymbol;
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
 * @param props.isLong - Whether this is for a long position
 * @param options - System tools for blockchain interactions
 * @returns Information about token liquidity and trading parameters
 */
export async function getPerpsLiquidity({ chainName, account, indexToken, isLong }: Props, options: FunctionOptions): Promise<FunctionReturn> {
    // Validate chain and get chainId
    const chainId = getChainFromName(chainName);
    if (!chainId) {
        return toResult(`Network ${chainName} not supported`, true);
    }

    const networkName = chainName.toLowerCase();
    const networkContracts = CONTRACT_ADDRESSES[networkName];

    if (!networkContracts || !networkContracts.VAULT || !networkContracts.VAULT_PRICE_FEED) {
        return toResult(`Core contract addresses (VAULT, VAULT_PRICE_FEED) not found for network: ${networkName}`, true);
    }

    let tokenAddressForContractCall: Address;
    let tokenDecimalsValue: number;
    let displaySymbol: TokenSymbol = indexToken; // Keep the original symbol for display and messages

    // Define allowed tokens based on chain and isLong
    const allowedTokens: Partial<Record<TokenSymbol, boolean>> = {};
    if (networkName === 'sonic') {
        if (isLong) {
            allowedTokens['WETH'] = true;
            allowedTokens['ANON'] = true;
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

    if (!allowedTokens[indexToken]) {
        return toResult(`Token ${displaySymbol} is not supported for the specified position type (long/short) on ${networkName}.`, true);
    }

    try {
        // Initial resolution for decimals and basic address.
        // The actual address used for contract calls might be overridden for native tokens.
        let preliminaryAddress = getTokenAddress(indexToken, networkName);
        tokenDecimalsValue = getTokenDecimals(indexToken, networkName);

        // Determine the correct address for Vault operations (especially for native tokens)
        if (networkName === 'sonic' && indexToken === 'S') {
            if (!networkContracts.WRAPPED_NATIVE_TOKEN) {
                return toResult('Wrapped native token (WS) address not found for Sonic chain.', true);
            }
            tokenAddressForContractCall = networkContracts.WRAPPED_NATIVE_TOKEN;
            displaySymbol = 'S'; // Ensure display symbol remains native
        } else if (networkName === 'base' && indexToken === 'ETH') {
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

    await options.notify('Checking perpetual trading liquidity information...');

    // Use getProvider from FunctionOptions
    const provider = options.getProvider(chainId);
    if (!provider) {
        return toResult('EVM provider not available. This function requires an EVM provider.', true);
    }

    try {
        // Get token price first to validate token is supported
        await options.notify('Fetching token price...');
        // Align getPrice arguments with the 'perps' version
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
        await options.notify('Fetching pool information...');
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
        // Price feed uses 30 decimals (PRICE_PRECISION in contracts)
        // Token amounts use tokenDecimalsValue
        const pricePrecisionBigInt = BigInt(10 ** 30);
        const tokenDecimalsBigInt = BigInt(10 ** tokenDecimalsValue);
        
        // To calculate USD: (amount * price) / (10^tokenDecimals * 10^priceExtraPrecision)
        // Here, priceResponse is already price * 10^30. So, (amount * priceResponse) / (10^tokenDecimals * 10^30)
        // = (amount / 10^tokenDecimals) * (priceResponse / 10^30)
        // Let's adjust to: (amount * priceResponse) / 10^(tokenDecimals + 30 - tokenDecimals) => (amount * priceResponse) / 10^30 if price is already adjusted for token decimals.
        // The contracts typically return price * 10^30.
        // Vault.poolAmounts returns amount in token decimals.
        // So, poolAmountUsd = (poolAmount * priceResponse) / (10^tokenDecimals * 10^(30-tokenDecimals)) = (poolAmount * priceResponse) / 10^30
        // No, this is simpler: (poolAmountWei * priceTokenUsdWei) / (10^tokenDecimals * 10^priceDecimals)
        // priceResponse is price * 10^30.
        // poolAmount is in token's atomic units (e.g., wei for 18 decimals).
        // So, USD value = (poolAmount * priceResponse) / (10^tokenDecimals * 10^30) -- this seems too large a divisor.

        // Correct calculation:
        // Price is given in terms of USD with 30 decimals. So, 1 token = priceResponse / (10^30) USD.
        // poolAmount is in atomic units (e.g., `amount * 10^tokenDecimals`).
        // So, poolAmount in actual tokens = poolAmount / (10^tokenDecimals).
        // poolAmountUsd = (poolAmount / 10^tokenDecimals) * (priceResponse / 10^30)
        // poolAmountUsd = (poolAmount * priceResponse) / (10^(tokenDecimals + 30))

        // However, the original code used 1e48, which implies priceResponse was price * 10^30 and token was 18 decimals.
        // 1e48 = 10^(18+30). This seems correct if tokenDecimals is 18.
        // Let's use the dynamic tokenDecimalsValue.
        const divisorForUsd = BigInt(10 ** (tokenDecimalsValue + 30));

        const poolAmountUsd = (poolAmount * priceResponse) / divisorForUsd;
        const reservedAmountUsd = (reservedAmount * priceResponse) / divisorForUsd;
        const availableLiquidityUsd = (availableLiquidity * priceResponse) / divisorForUsd;
        
        await options.notify(`Raw calculations for ${displaySymbol} (Decimals: ${tokenDecimalsValue}):`);
        await options.notify(`Pool Amount: ${poolAmount} wei`);
        await options.notify(`Reserved Amount: ${reservedAmount} wei`);
        await options.notify(`Available Liquidity: ${availableLiquidity} wei`);
        await options.notify(`Price Response: ${priceResponse} (1e30)`);
        await options.notify(`Pool Amount USD calculation: (${poolAmount} * ${priceResponse}) / 10^(${tokenDecimalsValue} + 30) = ${poolAmountUsd}`);
        await options.notify(`Reserved Amount USD calculation: (${reservedAmount} * ${priceResponse}) / 10^(${tokenDecimalsValue} + 30) = ${reservedAmountUsd}`);
        await options.notify(`Available Liquidity USD calculation: (${availableLiquidity} * ${priceResponse}) / 10^(${tokenDecimalsValue} + 30) = ${availableLiquidityUsd}`);

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

        await options.notify(`Pool Amount: ${liquidityInfo.poolAmount} ${displaySymbol} ($${liquidityInfo.poolAmountUsd})`);
        await options.notify(`Reserved Amount: ${liquidityInfo.reservedAmount} ${displaySymbol} ($${liquidityInfo.reservedAmountUsd})`);
        await options.notify(`Available Liquidity: ${liquidityInfo.availableLiquidity} ${displaySymbol} ($${liquidityInfo.availableLiquidityUsd})`);

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

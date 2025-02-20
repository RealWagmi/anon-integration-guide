import { Address, getContract, createPublicClient, http, Chain, type PublicClient } from 'viem';
import { FunctionReturn, FunctionOptions, toResult } from '@heyanon/sdk';
import { CONTRACT_ADDRESSES, NETWORKS } from '../../constants.js';
import { ERC20 } from '../../abis/ERC20.js';
import { Vault } from '../../abis/Vault.js';
import { getChainFromName } from '../../utils.js';
import { formatUnits } from 'viem';
import { VaultPriceFeed } from '../../abis/VaultPriceFeed.js';

interface Props {
    chainName: (typeof NETWORKS)[keyof typeof NETWORKS];
    account: Address;
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
 * Gets balances and USD values of all supported tokens on Amped Finance
 * @param props - The function parameters
 * @param props.chainName - The name of the chain (must be "sonic")
 * @param props.account - The account address to check balances for
 * @param options - System tools for blockchain interactions
 * @returns Information about token balances and their USD values
 */
export async function getUserTokenBalances({ chainName, account }: Props, options: FunctionOptions): Promise<FunctionReturn> {
    // Validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) {
        return toResult(`Network ${chainName} not supported`, true);
    }
    if (chainName !== NETWORKS.SONIC) {
        return toResult('This function is only supported on Sonic chain', true);
    }

    // Check wallet connection
    if (!account) {
        return toResult('Wallet not connected', true);
    }

    try {
        await options.notify('Fetching token balances...');

        const provider = options.evm.getProvider(chainId);
        const tokenInfos: TokenInfo[] = [];

        await options.notify('Initializing vault contract...');
        await options.notify(`Vault address: ${CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT}`);

        // Get native token (S) balance
        try {
            const nativeBalance = await provider.request({
                method: 'eth_getBalance',
                params: [account, 'latest'],
            });

            await options.notify(`Raw native balance: ${safeToString(nativeBalance)}`);
            const nativeBalanceBigInt = BigInt(safeToString(nativeBalance) || '0');
            await options.notify(`Native balance BigInt: ${nativeBalanceBigInt.toString()}`);

            await options.notify('Getting native token price...');
            await options.notify(`Native token address: ${CONTRACT_ADDRESSES[NETWORKS.SONIC].WRAPPED_NATIVE_TOKEN}`);

            const nativePrice = await provider.readContract({
                address: CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT_PRICE_FEED,
                abi: VaultPriceFeed,
                functionName: 'getPrice',
                args: [CONTRACT_ADDRESSES[NETWORKS.SONIC].WRAPPED_NATIVE_TOKEN, false, true, false],
            }) as bigint;

            await options.notify(`Native price from Amped Finance: ${nativePrice.toString()}`);

            // Price is in 1e30, balance in 1e18, result should be in USD (1e30)
            const nativeBalanceUsd = (nativeBalanceBigInt * nativePrice) / BigInt(1e18);

            await options.notify(`Native balance USD from Amped Finance: ${formatUnits(nativeBalanceUsd, 30)}`);

            // Add native token (S)
            tokenInfos.push({
                symbol: 'S',
                address: CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN,
                decimals: 18,
                balance: formatUnits(nativeBalanceBigInt, 18),
                balanceUsd: formatUnits(nativeBalanceUsd, 30),
                price: formatUnits(nativePrice, 30),
            });

            // Get wrapped native token (WS) balance
            const wrappedBalance = await provider.readContract({
                address: CONTRACT_ADDRESSES[NETWORKS.SONIC].WRAPPED_NATIVE_TOKEN,
                abi: ERC20,
                functionName: 'balanceOf',
                args: [account],
            }) as bigint;

            const wrappedBalanceUsd = (wrappedBalance * nativePrice) / BigInt(1e18);

            // Add wrapped native token (WS)
            tokenInfos.push({
                symbol: 'WS',
                address: CONTRACT_ADDRESSES[NETWORKS.SONIC].WRAPPED_NATIVE_TOKEN,
                decimals: 18,
                balance: formatUnits(wrappedBalance, 18),
                balanceUsd: formatUnits(wrappedBalanceUsd, 30),
                price: formatUnits(nativePrice, 30),
            });

        } catch (error) {
            console.error('Error details:', error);
            if (error instanceof Error) {
                console.error('Error stack:', error.stack);
            }
            return toResult(`Failed to get native token balance: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
        }

        const acceptedTokens = [
            { symbol: 'WETH', address: CONTRACT_ADDRESSES[NETWORKS.SONIC].WETH, decimals: 18 },
            { symbol: 'ANON', address: CONTRACT_ADDRESSES[NETWORKS.SONIC].ANON, decimals: 18 },
            { symbol: 'USDC', address: CONTRACT_ADDRESSES[NETWORKS.SONIC].USDC, decimals: 6 },
            { symbol: 'EURC', address: CONTRACT_ADDRESSES[NETWORKS.SONIC].EURC, decimals: 6 },
        ];

        // Get ERC20 token balances and prices in parallel
        const tokenDataPromises = acceptedTokens.map(async (token) => {
            const [balance, price] = await Promise.all([
                provider.readContract({
                    address: token.address,
                    abi: ERC20,
                    functionName: 'balanceOf',
                    args: [account],
                }) as Promise<bigint>,
                provider.readContract({
                    address: CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT_PRICE_FEED,
                    abi: VaultPriceFeed,
                    functionName: 'getPrice',
                    args: [token.address, false, true, false],
                }) as Promise<bigint>,
            ]);

            // Price is in 1e30, balance in token decimals, result should be in USD (1e30)
            const balanceUsd = (balance * price) / BigInt(10 ** token.decimals);

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
            return sum + Number(token.balanceUsd);
        }, 0);

        return toResult(
            JSON.stringify({
                tokens: tokenInfos,
                totalBalanceUsd: totalBalanceUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            }),
        );
    } catch (error) {
        console.error('Error details:', error);
        if (error instanceof Error) {
            console.error('Error stack:', error.stack);
        }
        if (error instanceof Error) {
            return toResult(`Failed to get token balances: ${error.message}`, true);
        }
        return toResult('Failed to get token balances: Unknown error', true);
    }
}

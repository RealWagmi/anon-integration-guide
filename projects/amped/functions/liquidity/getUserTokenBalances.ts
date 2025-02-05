import { Address, getContract, createPublicClient, http, Chain } from 'viem';
import { FunctionReturn, FunctionOptions, toResult, getChainFromName } from '@heyanon/sdk';
import { CONTRACT_ADDRESSES, NETWORKS } from '../../constants.js';
import { ERC20 } from '../../abis/ERC20.js';
import { Vault } from '../../abis/Vault.js';

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

/**
 * Gets balances and USD values of all supported tokens on Amped Finance
 * @param props - The function parameters
 * @param props.chainName - The name of the chain (must be "sonic")
 * @param props.account - The account address to check balances for
 * @param options - System tools for blockchain interactions
 * @returns Information about token balances and their USD values
 */
export async function getUserTokenBalances({ chainName, account }: Props, { getProvider, notify }: FunctionOptions): Promise<FunctionReturn> {
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
        await notify('Fetching token balances...');

        const provider = getProvider(chainId);
        const tokenInfos: TokenInfo[] = [];

        await notify('Initializing vault contract...');
        await notify(`Vault address: ${CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT}`);

        // Get native token (S) balance
        try {
            const nativeBalance = await provider.request({
                method: 'eth_getBalance',
                params: [account, 'latest'],
            });

            await notify(`Raw native balance: ${nativeBalance}`);
            const nativeBalanceBigInt = BigInt(nativeBalance);
            await notify(`Native balance BigInt: ${nativeBalanceBigInt.toString()}`);

            await notify('Getting native token price...');
            await notify(`Native token address: ${CONTRACT_ADDRESSES[NETWORKS.SONIC].WRAPPED_NATIVE_TOKEN}`);

            const nativePrice = await provider.readContract({
                address: CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT,
                abi: Vault,
                functionName: 'getMaxPrice',
                args: [CONTRACT_ADDRESSES[NETWORKS.SONIC].WRAPPED_NATIVE_TOKEN],
            }) as bigint;

            await notify(`Native price from Amped Finance: ${nativePrice.toString()}`);

            // Price is in 1e30, balance in 1e18, result should be in USD
            const nativeBalanceUsd = (nativeBalanceBigInt * nativePrice) / BigInt(1e48);

            await notify(`Native balance USD from Amped Finance: ${nativeBalanceUsd.toString()}`);

            // Add native token (S)
            tokenInfos.push({
                symbol: 'S',
                address: CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN,
                decimals: 18,
                balance: nativeBalanceBigInt.toString(),
                balanceUsd: nativeBalanceUsd.toString(),
                price: nativePrice.toString(),
            });

            // Get wrapped native token (WS) balance
            const wrappedBalance = await provider.readContract({
                address: CONTRACT_ADDRESSES[NETWORKS.SONIC].WRAPPED_NATIVE_TOKEN,
                abi: ERC20,
                functionName: 'balanceOf',
                args: [account],
            }) as bigint;

            const wrappedBalanceUsd = (wrappedBalance * nativePrice) / BigInt(1e48);

            // Add wrapped native token (WS)
            tokenInfos.push({
                symbol: 'WS',
                address: CONTRACT_ADDRESSES[NETWORKS.SONIC].WRAPPED_NATIVE_TOKEN,
                decimals: 18,
                balance: wrappedBalance.toString(),
                balanceUsd: wrappedBalanceUsd.toString(),
                price: nativePrice.toString(),
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
                    address: CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT,
                    abi: Vault,
                    functionName: 'getMaxPrice',
                    args: [token.address],
                }) as Promise<bigint>,
            ]);

            // Price is in 1e30, balance in token decimals, result should be in USD
            const balanceUsd = (balance * price) / (BigInt(10) ** BigInt(token.decimals) * BigInt(1e30));

            return {
                ...token,
                balance: balance.toString(),
                balanceUsd: balanceUsd.toString(),
                price: price.toString(),
            };
        });

        // Wait for all token data to be fetched
        const tokenResults = await Promise.all(tokenDataPromises);
        tokenInfos.push(...tokenResults);

        return toResult(
            JSON.stringify({
                tokens: tokenInfos,
                totalBalanceUsd: tokenInfos.reduce((sum, token) => sum + Number(token.balanceUsd), 0).toString(),
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

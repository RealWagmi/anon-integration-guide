import { Address, getContract, PublicClient } from 'viem';
import { FunctionReturn, FunctionOptions, toResult } from '@heyanon/sdk';
import { CONTRACT_ADDRESSES, NETWORKS } from '../../constants.js';
import { ERC20 } from '../../abis/ERC20.js';
import { Vault } from '../../abis/Vault.js';

interface TokenInfo {
  symbol: string;
  address: Address;
  decimals: number;
  balance: string;
  balanceUsd: string;
  price: string;
}

/**
 * Gets balances and USD values of all accepted liquidity tokens
 * @param props - The chain name
 * @param options - SDK function options
 * @returns Information about accepted tokens and their balances
 */
export async function getAcceptedTokenBalances(
  chainName: string,
  { getProvider, notify }: FunctionOptions
): Promise<FunctionReturn> {
  try {
    // Validate chain
    if (chainName.toLowerCase() !== "sonic") {
      return toResult("This function is only supported on Sonic chain", true);
    }

    await notify("Fetching token balances...");

    const provider = getProvider(146) as PublicClient;
    if (!('account' in provider) || !provider.account?.address) {
      return toResult("No account connected", true);
    }

    const userAddress = provider.account.address;

    const acceptedTokens = [
      { symbol: 'S', address: CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN, decimals: 18 },
      { symbol: 'WETH', address: CONTRACT_ADDRESSES[NETWORKS.SONIC].WETH, decimals: 18 },
      { symbol: 'ANON', address: CONTRACT_ADDRESSES[NETWORKS.SONIC].ANON, decimals: 18 },
      { symbol: 'USDC', address: CONTRACT_ADDRESSES[NETWORKS.SONIC].USDC, decimals: 6 },
      { symbol: 'EURC', address: CONTRACT_ADDRESSES[NETWORKS.SONIC].EURC, decimals: 6 }
    ];

    // Initialize vault contract for price fetching
    const vault = getContract({
      address: CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT,
      abi: Vault,
      client: provider
    });

    const tokenInfos: TokenInfo[] = [];

    // Get native token balance
    const nativeBalance = await provider.request({
      method: 'eth_getBalance',
      params: [userAddress, 'latest']
    });
    const nativeBalanceBigInt = BigInt(nativeBalance);
    const nativePrice = await vault.read.getMaxPrice([CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN]) as bigint;
    const nativeBalanceUsd = (nativeBalanceBigInt * nativePrice) / (10n ** 30n); // Price is in 1e30
    
    tokenInfos.push({
      symbol: 'S',
      address: CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN,
      decimals: 18,
      balance: nativeBalanceBigInt.toString(),
      balanceUsd: nativeBalanceUsd.toString(),
      price: nativePrice.toString()
    });

    // Get ERC20 token balances
    for (const token of acceptedTokens.slice(1)) { // Skip native token
      const tokenContract = getContract({
        address: token.address,
        abi: ERC20,
        client: provider
      });

      const balance = await tokenContract.read.balanceOf([userAddress]) as bigint;
      const price = await vault.read.getMaxPrice([token.address]) as bigint;
      const balanceUsd = (balance * price) / (10n ** BigInt(token.decimals) * 10n ** 30n); // Price is in 1e30

      tokenInfos.push({
        ...token,
        balance: balance.toString(),
        balanceUsd: balanceUsd.toString(),
        price: price.toString()
      });
    }

    return toResult(JSON.stringify({
      tokens: tokenInfos,
      totalBalanceUsd: tokenInfos.reduce((sum, token) => sum + BigInt(token.balanceUsd), 0n).toString()
    }));
  } catch (error) {
    console.error('Error in getAcceptedTokenBalances:', error);
    
    if (error instanceof Error) {
      return toResult(`Failed to get token balances: ${error.message}`, true);
    }
    return toResult("Failed to get token balances. Please try again.", true);
  }
} 
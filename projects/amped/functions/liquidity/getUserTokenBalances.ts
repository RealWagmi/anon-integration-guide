import { Address, getContract } from 'viem';
import { FunctionReturn, FunctionOptions, toResult, getChainFromName } from '@heyanon/sdk';
import { CONTRACT_ADDRESSES, NETWORKS } from '../../constants.js';
import { ERC20 } from '../../abis/ERC20.js';
import { Vault } from '../../abis/Vault.js';

interface Props {
  chainName: string;
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
 * Gets balances and USD values of all supported tokens
 * @param props - The function parameters
 * @param props.chainName - The name of the chain (must be "sonic")
 * @param props.account - The account address to check balances for
 * @param options - System tools for blockchain interactions
 * @returns Information about token balances and their USD values
 */
export async function getUserTokenBalances(
  { chainName, account }: Props,
  { getProvider, notify }: FunctionOptions
): Promise<FunctionReturn> {
  // Check wallet connection
  if (!account) return toResult("Wallet not connected", true);

  // Validate chain
  const chainId = getChainFromName(chainName);
  if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
  if (chainName !== NETWORKS.SONIC) {
    return toResult(`Protocol is only supported on Sonic chain`, true);
  }

  try {
    await notify("Fetching token balances...");

    const provider = getProvider(chainId);

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
      params: [account, 'latest']
    });
    const nativeBalanceBigInt = BigInt(nativeBalance);
    const nativePrice = await vault.read.getMaxPrice([CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN]) as bigint;
    // Price is in 1e30, balance in 1e18, result should be in 1e18 for USD
    const nativeBalanceUsd = (nativeBalanceBigInt * nativePrice) / (10n ** 30n);
    
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

      const balance = await tokenContract.read.balanceOf([account]) as bigint;
      const price = await vault.read.getMaxPrice([token.address]) as bigint;
      
      // For tokens with decimals other than 18, we need to adjust the calculation
      // balance * price / (10^token_decimals * 10^30) * 10^18
      const balanceUsd = (balance * price * 10n ** BigInt(18 - token.decimals)) / 10n ** 30n;

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
    if (error instanceof Error) {
      return toResult(`Failed to get token balances: ${error.message}`, true);
    }
    return toResult("Failed to get token balances: Unknown error", true);
  }
} 
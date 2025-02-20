import { formatUnits, getContract } from 'viem';
import { FunctionReturn, FunctionOptions, toResult } from '@heyanon/sdk';
import { CONTRACT_ADDRESSES, NETWORKS } from '../../constants.js';
import { getChainFromName } from '../../utils.js';
import { VaultPriceFeed } from '../../abis/VaultPriceFeed.js';

interface Props {
    chainName: (typeof NETWORKS)[keyof typeof NETWORKS];
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
}

interface PoolLiquidity {
    totalSupply: string;
    totalSupplyUsd: string;
    aum: string;
    aumPerToken: string;
    tokens: TokenLiquidity[];
}

// Define the specific ABI for the functions we need
const GLP_TOKEN_ABI = [
    {
        inputs: [],
        name: 'totalSupply',
        outputs: [{ type: 'uint256', name: '' }],
        stateMutability: 'view',
        type: 'function',
    },
] as const;

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
 * Gets the total liquidity pool (ALP) supply and Assets Under Management (AUM) on Amped Finance
 * @param props - The function parameters
 * @param props.chainName - The name of the chain (must be "sonic")
 * @param options - System tools for blockchain interactions
 * @returns Pool information including total supply, AUM, and individual token liquidity
 */
export async function getPoolLiquidity({ chainName }: Props, options: FunctionOptions): Promise<FunctionReturn> {
    // Validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) {
        return toResult(`Network ${chainName} not supported`, true);
    }
    if (chainName !== NETWORKS.SONIC) {
        return toResult('This function is only supported on Sonic chain', true);
    }

    try {
        await options.notify('Fetching pool liquidity information...');

        const provider = options.evm.getProvider(chainId);

        // Get total supply and AUM in parallel
        const [totalSupply, aum] = await Promise.all([
            provider.readContract({
                address: CONTRACT_ADDRESSES[NETWORKS.SONIC].GLP_TOKEN,
                abi: GLP_TOKEN_ABI,
                functionName: 'totalSupply',
            }) as Promise<bigint>,
            provider.readContract({
                address: CONTRACT_ADDRESSES[NETWORKS.SONIC].GLP_MANAGER,
                abi: GLP_MANAGER_ABI,
                functionName: 'getAum',
                args: [true], // Include pending changes
            }) as Promise<bigint>,
        ]);

        // Define supported tokens
        const supportedTokens = [
            { symbol: 'S', address: CONTRACT_ADDRESSES[NETWORKS.SONIC].WRAPPED_NATIVE_TOKEN, decimals: 18 },
            { symbol: 'WETH', address: CONTRACT_ADDRESSES[NETWORKS.SONIC].WETH, decimals: 18 },
            { symbol: 'ANON', address: CONTRACT_ADDRESSES[NETWORKS.SONIC].ANON, decimals: 18 },
            { symbol: 'USDC', address: CONTRACT_ADDRESSES[NETWORKS.SONIC].USDC, decimals: 6 },
            { symbol: 'EURC', address: CONTRACT_ADDRESSES[NETWORKS.SONIC].EURC, decimals: 6 },
        ];

        await options.notify('Fetching individual token liquidity...');

        // Get liquidity info for each token
        const tokenLiquidity: TokenLiquidity[] = await Promise.all(
            supportedTokens.map(async (token) => {
                const [poolAmount, reservedAmount, price] = await Promise.all([
                    provider.readContract({
                        address: CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT,
                        abi: VAULT_ABI,
                        functionName: 'poolAmounts',
                        args: [token.address],
                    }) as Promise<bigint>,
                    provider.readContract({
                        address: CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT,
                        abi: VAULT_ABI,
                        functionName: 'reservedAmounts',
                        args: [token.address],
                    }) as Promise<bigint>,
                    provider.readContract({
                        address: CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT_PRICE_FEED,
                        abi: VaultPriceFeed,
                        functionName: 'getPrice',
                        args: [token.address, false, true, false],
                    }) as Promise<bigint>,
                ]);

                const availableAmount = poolAmount - reservedAmount;

                // Calculate USD values with proper precision
                // Price is in 1e30, amounts in token decimals
                const poolAmountUsd = (poolAmount * price) / BigInt(10 ** token.decimals);
                const reservedAmountUsd = (reservedAmount * price) / BigInt(10 ** token.decimals);
                const availableAmountUsd = (availableAmount * price) / BigInt(10 ** token.decimals);

                return {
                    symbol: token.symbol,
                    address: token.address,
                    poolAmount: formatUnits(poolAmount, token.decimals),
                    reservedAmount: formatUnits(reservedAmount, token.decimals),
                    availableAmount: formatUnits(availableAmount, token.decimals),
                    price: formatUnits(price, 30),
                    poolAmountUsd: formatUnits(poolAmountUsd, 30),
                    reservedAmountUsd: formatUnits(reservedAmountUsd, 30),
                    availableAmountUsd: formatUnits(availableAmountUsd, 30),
                };
            }),
        );

        // Calculate derived values with safe conversions
        const totalSupplyFormatted = formatUnits(totalSupply, 18);
        const aumFormatted = formatUnits(aum, 30);
        const aumPerToken = totalSupply === 0n ? '0' : formatUnits((aum * BigInt(1e18)) / totalSupply, 30);

        const poolLiquidity: PoolLiquidity = {
            totalSupply: totalSupplyFormatted,
            totalSupplyUsd: aumFormatted,
            aum: aumFormatted,
            aumPerToken,
            tokens: tokenLiquidity,
        };

        await options.notify(`Total ALP Supply: ${poolLiquidity.totalSupply} ALP`);
        await options.notify(`Total Value Locked: $${Number(poolLiquidity.aum).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
        await options.notify(`ALP Price: $${Number(poolLiquidity.aumPerToken).toLocaleString(undefined, { minimumFractionDigits: 6, maximumFractionDigits: 6 })}`);

        return toResult(JSON.stringify(poolLiquidity));
    } catch (error) {
        if (error instanceof Error) {
            return toResult(`Failed to fetch pool liquidity: ${error.message}`, true);
        }
        return toResult('Failed to fetch pool liquidity: Unknown error', true);
    }
}

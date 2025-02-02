import { formatUnits, getContract } from 'viem';
import { FunctionReturn, FunctionOptions, toResult, getChainFromName } from '@heyanon/sdk';
import { CONTRACT_ADDRESSES, NETWORKS } from '../../constants.js';

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

/**
 * Gets the total liquidity pool (ALP) supply and Assets Under Management (AUM) on Amped Finance
 * @param props - The function parameters
 * @param props.chainName - The name of the chain (must be "sonic")
 * @param options - System tools for blockchain interactions
 * @returns Pool information including total supply, AUM, and individual token liquidity
 */
export async function getPoolLiquidity({ chainName }: Props, { notify, getProvider }: FunctionOptions): Promise<FunctionReturn> {
    // Validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) {
        return toResult(`Network ${chainName} not supported`, true);
    }
    if (chainName !== NETWORKS.SONIC) {
        return toResult('This function is only supported on Sonic chain', true);
    }

    try {
        await notify('Fetching pool liquidity information...');

        const provider = getProvider(chainId);

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
            { symbol: 'S', address: CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN, decimals: 18 },
            { symbol: 'WETH', address: CONTRACT_ADDRESSES[NETWORKS.SONIC].WETH, decimals: 18 },
            { symbol: 'ANON', address: CONTRACT_ADDRESSES[NETWORKS.SONIC].ANON, decimals: 18 },
            { symbol: 'USDC', address: CONTRACT_ADDRESSES[NETWORKS.SONIC].USDC, decimals: 6 },
            { symbol: 'EURC', address: CONTRACT_ADDRESSES[NETWORKS.SONIC].EURC, decimals: 6 },
        ];

        await notify('Fetching individual token liquidity...');

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
                        address: CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT,
                        abi: VAULT_ABI,
                        functionName: 'getMinPrice',
                        args: [token.address],
                    }) as Promise<bigint>,
                ]);

                const availableAmount = poolAmount - reservedAmount;
                const priceFormatted = formatUnits(price, 30);

                const poolAmountFormatted = formatUnits(poolAmount, token.decimals);
                const reservedAmountFormatted = formatUnits(reservedAmount, token.decimals);
                const availableAmountFormatted = formatUnits(availableAmount, token.decimals);

                const poolAmountUsd = (Number(poolAmountFormatted) * Number(priceFormatted)).toString();
                const reservedAmountUsd = (Number(reservedAmountFormatted) * Number(priceFormatted)).toString();
                const availableAmountUsd = (Number(availableAmountFormatted) * Number(priceFormatted)).toString();

                return {
                    symbol: token.symbol,
                    address: token.address,
                    poolAmount: poolAmountFormatted,
                    reservedAmount: reservedAmountFormatted,
                    availableAmount: availableAmountFormatted,
                    price: priceFormatted,
                    poolAmountUsd,
                    reservedAmountUsd,
                    availableAmountUsd,
                };
            }),
        );

        // Calculate derived values
        const totalSupplyFormatted = formatUnits(totalSupply, 18);
        const aumFormatted = formatUnits(aum, 30);
        const aumPerToken = totalSupply === 0n ? '0' : (Number(aumFormatted) / Number(totalSupplyFormatted)).toString();

        const poolLiquidity: PoolLiquidity = {
            totalSupply: totalSupplyFormatted,
            totalSupplyUsd: aumFormatted,
            aum: aumFormatted,
            aumPerToken,
            tokens: tokenLiquidity,
        };

        await notify(`Total ALP Supply: ${poolLiquidity.totalSupply} ALP`);
        await notify(`Total Value Locked: $${poolLiquidity.aum}`);
        await notify(`ALP Price: $${poolLiquidity.aumPerToken}`);

        return toResult(JSON.stringify(poolLiquidity));
    } catch (error) {
        if (error instanceof Error) {
            return toResult(`Failed to fetch pool liquidity: ${error.message}`, true);
        }
        return toResult('Failed to fetch pool liquidity: Unknown error', true);
    }
}

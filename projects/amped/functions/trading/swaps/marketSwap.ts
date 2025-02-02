import { type Address, encodeFunctionData } from 'viem';
import { FunctionReturn, FunctionOptions, toResult, getChainFromName, TransactionParams } from '@heyanon/sdk';
import { CONTRACT_ADDRESSES, NETWORKS } from '../../../constants.js';
import { Router } from '../../../abis/Router.js';
import { Vault } from '../../../abis/Vault.js';
import { getUserTokenBalances } from '../../liquidity/getUserTokenBalances.js';
import { getSwapsLiquidity } from '../swaps/getSwapsLiquidity.js';
import { ERC20 } from '../../../abis/ERC20.js';
import { formatUnits } from 'viem';

type TokenSymbol = 'S' | 'WETH' | 'ANON' | 'USDC' | 'EURC';

interface Props {
    chainName: (typeof NETWORKS)[keyof typeof NETWORKS];
    account: Address;
    tokenIn: TokenSymbol;
    tokenOut: TokenSymbol;
    amountIn: string;
    slippageBps?: number;
}

const TOKEN_ADDRESSES: Record<TokenSymbol, Address> = {
    S: CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN,
    WETH: CONTRACT_ADDRESSES[NETWORKS.SONIC].WETH,
    ANON: CONTRACT_ADDRESSES[NETWORKS.SONIC].ANON,
    USDC: CONTRACT_ADDRESSES[NETWORKS.SONIC].USDC,
    EURC: CONTRACT_ADDRESSES[NETWORKS.SONIC].EURC,
} as const;

const TOKEN_DECIMALS: Record<TokenSymbol, number> = {
    S: 18,
    WETH: 18,
    ANON: 18,
    USDC: 6,
    EURC: 6,
} as const;

// Helper function to convert BigInt values to strings for logging
function convertBigIntsToString(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'bigint') return obj.toString();
    if (Array.isArray(obj)) return obj.map(convertBigIntsToString);
    if (typeof obj === 'object') {
        return Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, convertBigIntsToString(value)]));
    }
    return obj;
}

/**
 * Executes a market swap between two tokens on Amped Finance
 * @param props - The swap parameters
 * @param props.chainName - The name of the chain (must be "sonic")
 * @param props.account - The account address executing the swap
 * @param props.tokenIn - The token to swap from
 * @param props.tokenOut - The token to swap to
 * @param props.amountIn - The amount of tokenIn to swap
 * @param props.slippageBps - Optional slippage tolerance in basis points (1 bps = 0.01%)
 * @param options - System tools for blockchain interactions
 * @returns Transaction result with swap details
 */
export async function marketSwap(
    { chainName, account, tokenIn, tokenOut, amountIn, slippageBps = 100 }: Props,
    { notify, getProvider, sendTransactions }: FunctionOptions,
): Promise<FunctionReturn> {
    // Validate chain using SDK helper
    const chainId = getChainFromName(chainName);
    if (!chainId) {
        return toResult(`Unsupported chain name: ${chainName}`, true);
    }
    if (chainName !== NETWORKS.SONIC) {
        return toResult('This function is only supported on Sonic chain', true);
    }

    // Validate tokens
    if (tokenIn === tokenOut) {
        return toResult('Cannot swap token to itself', true);
    }

    if (!TOKEN_ADDRESSES[tokenIn] || !TOKEN_ADDRESSES[tokenOut]) {
        return toResult(`Invalid token symbol. Supported tokens are: ${Object.keys(TOKEN_ADDRESSES).join(', ')}`, true);
    }

    try {
        await notify('Checking token balances and liquidity...');

        // Check user's token balances
        const balanceResult = await getUserTokenBalances({ chainName, account }, { getProvider, notify, sendTransactions });

        if (!balanceResult.success) {
            return toResult(`Failed to check token balances: ${balanceResult.data}`, true);
        }

        const balances = JSON.parse(balanceResult.data).tokens;
        const tokenBalance = balances.find((t: any) => t.symbol === tokenIn);

        if (!tokenBalance) {
            return toResult(`Failed to find balance for ${tokenIn}`, true);
        }

        // Convert input amount to proper decimals
        const amountInBigInt = BigInt(Math.floor(parseFloat(amountIn) * Math.pow(10, TOKEN_DECIMALS[tokenIn])).toString());

        // Check if user has sufficient balance
        if (BigInt(tokenBalance.balance) < amountInBigInt) {
            return toResult(`Insufficient ${tokenIn} balance. You have ${formatUnits(BigInt(tokenBalance.balance), TOKEN_DECIMALS[tokenIn])} ${tokenIn}, but tried to swap ${amountIn} ${tokenIn}`, true);
        }

        // Check liquidity
        const liquidityResult = await getSwapsLiquidity({ chainName, account }, { getProvider, notify, sendTransactions });

        if (!liquidityResult.success) {
            return toResult(`Failed to check liquidity: ${liquidityResult.data}`, true);
        }

        // Parse liquidity data and validate amounts
        const liquidityData = JSON.parse(liquidityResult.data);
        const tokenOutLiquidity = liquidityData.liquidity.find((l: any) => l.symbol === tokenOut);

        if (!tokenOutLiquidity) {
            return toResult(`Failed to find liquidity data for ${tokenOut}`, true);
        }

        // Check if there's sufficient available liquidity for the output token
        const availableOutAmount = BigInt(tokenOutLiquidity.availableAmount);
        if (availableOutAmount <= 0n) {
            return toResult(`No available liquidity for ${tokenOut} in the pool`, true);
        }

        // Additional safety check for minimum pool amount (0.1% of current pool)
        const minPoolAmount = availableOutAmount / 1000n;
        if (availableOutAmount <= minPoolAmount) {
            return toResult(`Pool liquidity for ${tokenOut} (${formatUnits(availableOutAmount, TOKEN_DECIMALS[tokenOut])} ${tokenOut}) is too low for swaps`, true);
        }

        const provider = getProvider(chainId); // Use chainId from validation

        // Prepare transaction data
        const transactions: TransactionParams[] = [];

        // Add approval transaction if needed for non-native token swaps
        if (tokenIn !== 'S') {
            const allowance = (await provider.readContract({
                address: TOKEN_ADDRESSES[tokenIn],
                abi: ERC20,
                functionName: 'allowance',
                args: [account, CONTRACT_ADDRESSES[NETWORKS.SONIC].ROUTER],
            })) as bigint;

            if (allowance < amountInBigInt) {
                const approvalData = encodeFunctionData({
                    abi: ERC20,
                    functionName: 'approve',
                    args: [CONTRACT_ADDRESSES[NETWORKS.SONIC].ROUTER, amountInBigInt],
                });

                transactions.push({
                    target: TOKEN_ADDRESSES[tokenIn],
                    data: approvalData,
                    value: 0n,
                });
            }
        }

        // Prepare swap path
        const swapPath = [TOKEN_ADDRESSES[tokenIn], TOKEN_ADDRESSES[tokenOut]];

        // Add swap transaction based on token types
        let swapData: `0x${string}`;
        let swapValue = 0n;

        if (tokenIn === 'S') {
            // Native token to token swap
            swapData = encodeFunctionData({
                abi: Router,
                functionName: 'swapETHToTokens',
                args: [
                    swapPath,
                    0n, // minOut set to 0 for market swaps
                    account,
                ],
            });
            swapValue = amountInBigInt;
        } else if (tokenOut === 'S') {
            // Token to native token swap
            swapData = encodeFunctionData({
                abi: Router,
                functionName: 'swapTokensToETH',
                args: [
                    swapPath,
                    amountInBigInt,
                    0n, // minOut set to 0 for market swaps
                    account,
                ],
            });
        } else {
            // Token to token swap
            swapData = encodeFunctionData({
                abi: Router,
                functionName: 'swap',
                args: [
                    swapPath,
                    amountInBigInt,
                    0n, // minOut set to 0 for market swaps
                    account,
                ],
            });
        }

        transactions.push({
            target: CONTRACT_ADDRESSES[NETWORKS.SONIC].ROUTER,
            data: swapData,
            value: swapValue,
        });

        await notify('Executing swap transaction...');

        // Send transactions
        const txResult = await sendTransactions({
            chainId,
            account,
            transactions,
        });

        if (!txResult.data) {
            return toResult(`Swap failed: No transaction hash returned`, true);
        }

        return toResult(
            JSON.stringify({
                success: true,
                tokenIn,
                tokenOut,
                amountIn: amountInBigInt.toString(),
                txHash: txResult.data,
            }),
        );
    } catch (error) {
        if (error instanceof Error) {
            return toResult(`Market swap failed: ${error.message}`, true);
        }
        return toResult('Market swap failed: Unknown error', true);
    }
}

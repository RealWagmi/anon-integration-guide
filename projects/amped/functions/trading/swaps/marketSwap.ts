import { Address, getContract } from 'viem';
import { FunctionReturn, FunctionOptions, toResult } from '@heyanon/sdk';
import { CONTRACT_ADDRESSES, NETWORKS } from '../../../constants.js';
import { Router } from '../../../abis/Router.js';

interface MarketSwapProps {
    chainName: typeof NETWORKS[keyof typeof NETWORKS];
    account: Address;
    tokenIn: Address;
    tokenOut: Address;
    amountIn: bigint;
    minAmountOut: bigint;
}

/**
 * Executes a market swap between two tokens on Amped Finance
 * @param props - The swap parameters
 * @param props.chainName - The name of the chain (must be "sonic")
 * @param props.account - The account executing the swap
 * @param props.tokenIn - Address of the input token
 * @param props.tokenOut - Address of the output token
 * @param props.amountIn - Amount of input tokens to swap
 * @param props.minAmountOut - Minimum amount of output tokens to receive
 * @param options - System tools for blockchain interactions
 * @returns Transaction result with swap details
 */
export async function marketSwap(
    { chainName, account, tokenIn, tokenOut, amountIn, minAmountOut }: MarketSwapProps,
    { getProvider, notify }: FunctionOptions
): Promise<FunctionReturn> {
    // Validate chain
    if (!Object.values(NETWORKS).includes(chainName)) {
        return toResult(`Network ${chainName} not supported`, true);
    }

    await notify('Preparing market swap...');

    try {
        const provider = getProvider(146); // Sonic chain ID
        const routerAddress = CONTRACT_ADDRESSES[NETWORKS.SONIC].ROUTER;

        const router = getContract({
            address: routerAddress,
            abi: Router,
            client: provider
        });

        // Execute swap
        const tx = await router.write.swap(
            [tokenIn, tokenOut, amountIn, minAmountOut, account],
            { value: tokenIn === CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN ? amountIn : 0n }
        );

        return toResult(JSON.stringify({
            success: true,
            transactionHash: tx,
            details: {
                tokenIn,
                tokenOut,
                amountIn: amountIn.toString(),
                minAmountOut: minAmountOut.toString()
            }
        }));
    } catch (error) {
        if (error instanceof Error) {
            return toResult(`Failed to execute market swap: ${error.message}`, true);
        }
        return toResult('Failed to execute market swap: Unknown error', true);
    }
} 
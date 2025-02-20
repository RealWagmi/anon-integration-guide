// functions/mintUnit.ts
import { EVM, EvmChain, FunctionOptions, FunctionReturn, toResult, Chain } from '@heyanon/sdk';
import { Address, encodeFunctionData } from 'viem';
import { ADDRESSES } from '../constants';
import { delayedOrderAbi } from '../abis/delayedOrder';
import { getKeeperFee } from './getKeeperFee';

const { checkToApprove, getChainFromName } = EVM.utils;

interface Props {
    chainName: string;          // Network name (BASE)
    rethAmount: string;         // Amount of rETH to deposit
    slippageTolerance?: string; // Maximum allowed slippage (default 0.25%)
    account: Address;           // User's wallet address
}

/**
 * Deposits rETH to mint UNIT tokens as a Liquidity Provider
 * @param props - The deposit parameters including rETH amount and slippage tolerance
 * @param options - System tools for blockchain interactions
 * @returns Transaction result
 */
export async function mintUnit(
    { chainName, rethAmount, slippageTolerance = '0.25', account }: Props,
    { notify, evm: { getProvider, sendTransactions } }: FunctionOptions
): Promise<FunctionReturn> {
    if (!account) return toResult('Wallet not connected', true);

    const chainId = getChainFromName(chainName as EvmChain);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);

    try {
        await notify('Preparing to mint UNIT tokens...');
        const provider = getProvider(chainId);
        const addresses = ADDRESSES[Chain.BASE];

        // Get keeper fee using the standalone function
        let keeperFee;
        try {
            keeperFee = await getKeeperFee(provider);
        } catch (feeError) {
            return toResult('Failed to get keeper fee', true);
        }

        const transactions: EVM.types.TransactionParams[] = [];
        const marginAmountBigInt = BigInt(rethAmount);

        // Check and prepare rETH approval if needed
        await checkToApprove({
            args: {
                account,
                target: addresses.RETH_TOKEN,
                spender: addresses.DELAYED_ORDER,
                amount: marginAmountBigInt
            },
            provider,
            transactions
        });

        // Calculate minimum amount out based on slippage tolerance
        const minAmountOut = calculateMinAmountOut(rethAmount, slippageTolerance);

        // Prepare mint transaction
        const tx: EVM.types.TransactionParams = {
            target: addresses.DELAYED_ORDER,
            data: encodeFunctionData({
                abi: delayedOrderAbi,
                functionName: 'announceStableDeposit',
                args: [
                    marginAmountBigInt,  // Amount of rETH to deposit
                    minAmountOut,        // Minimum UNIT tokens to receive
                    keeperFee            // Fee for keeper execution
                ]
            })
        };

        transactions.push(tx);

        await notify('Waiting for transaction confirmation...');
        
        const result = await sendTransactions({ chainId, account, transactions });
        
        return toResult(
            `Successfully submitted order to mint UNIT tokens. ${result.data[result.data.length - 1].message}`
        );
    } catch (error) {
        const errorMessage = error instanceof Error 
            ? error.message 
            : 'An unknown error occurred';
        return toResult(`Error minting UNIT: ${errorMessage}`, true);
    }
}

/**
 * Calculates the minimum amount of UNIT tokens to receive based on slippage tolerance
 * @param amount - The input rETH amount
 * @param slippageTolerance - Maximum allowed slippage percentage
 * @returns Minimum acceptable output amount
 */
function calculateMinAmountOut(amount: string, slippageTolerance: string): bigint {
    const amountBigInt = BigInt(amount);
    const slippageMultiplier = 1000n - (BigInt(parseFloat(slippageTolerance) * 10) * 100n);
    return (amountBigInt * slippageMultiplier) / 1000n;
}


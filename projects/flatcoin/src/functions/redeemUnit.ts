// functions/redeemUnit.ts
import { EVM, EvmChain, FunctionOptions, FunctionReturn, toResult, Chain } from '@heyanon/sdk';
import { Address, encodeFunctionData } from 'viem';
import { ADDRESSES } from '../constants';
import { delayedOrderAbi } from '../abis/delayedOrder';
import { getKeeperFee } from './getKeeperFee';

const { getChainFromName } = EVM.utils;

interface Props {
    chainName: string;          // Network name (BASE)
    unitAmount: string;         // Amount of UNIT tokens to redeem
    minAmountOut: string;       // Minimum amount of rETH to receive
    account: Address;           // User's wallet address
}

/**
 * Redeems UNIT tokens back to rETH
 * @param props - The parameters including UNIT amount and minimum output
 * @param options - System tools for blockchain interactions
 * @returns Transaction result
 */
export async function redeemUnit(
    { chainName, unitAmount, minAmountOut, account }: Props,
    { notify, evm: { getProvider, sendTransactions } }: FunctionOptions
): Promise<FunctionReturn> {
    if (!account) return toResult('Wallet not connected', true);

    const chainId = getChainFromName(chainName as EvmChain);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);

    try {
        await notify('Preparing to redeem UNIT tokens...');
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

        // Prepare redeem transaction
        const tx: EVM.types.TransactionParams = {
            target: addresses.DELAYED_ORDER,
            data: encodeFunctionData({
                abi: delayedOrderAbi,
                functionName: 'announceStableWithdraw',
                args: [
                    BigInt(unitAmount),    // Amount of UNIT tokens to redeem
                    BigInt(minAmountOut),  // Minimum rETH to receive
                    keeperFee              // Fee for keeper execution
                ]
            })
        };

        transactions.push(tx);

        await notify('Waiting for transaction confirmation...');
        
        const result = await sendTransactions({ chainId, account, transactions });
        
        return toResult(
            `Successfully submitted order to redeem UNIT tokens. ${result.data[result.data.length - 1].message}`
        );
    } catch (error) {
        const errorMessage = error instanceof Error 
            ? error.message 
            : 'An unknown error occurred';
        return toResult(`Error redeeming UNIT: ${errorMessage}`, true);
    }
}


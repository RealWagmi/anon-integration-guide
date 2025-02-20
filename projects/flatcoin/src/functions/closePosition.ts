// functions/closePosition.ts
import { EVM, EvmChain, FunctionOptions, FunctionReturn, toResult, Chain } from '@heyanon/sdk';
import { Address, encodeFunctionData } from 'viem';
import { ADDRESSES } from '../constants';
import { leverageModuleAbi } from '../abis/leverageModule';
import { getKeeperFee } from './getKeeperFee';

const { getChainFromName } = EVM.utils;

interface Props {
    chainName: string;          // Network name (BASE)
    positionId: string;         // ID of the position to close
    minFillPrice: string;       // Minimum acceptable price for closing
    account: Address;           // User's wallet address
}

/**
 * Closes an existing leveraged position
 * @param props - The parameters including position ID and minimum fill price
 * @param options - System tools for blockchain interactions
 * @returns Transaction result
 */
export async function closePosition(
    { chainName, positionId, minFillPrice, account }: Props,
    { notify, evm: { getProvider, sendTransactions } }: FunctionOptions
): Promise<FunctionReturn> {
    if (!account) return toResult('Wallet not connected', true);

    const chainId = getChainFromName(chainName as EvmChain);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);

    try {
        await notify('Preparing to close position...');
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

        // Prepare close position transaction
        const tx: EVM.types.TransactionParams = {
            target: addresses.LEVERAGE_MODULE,
            data: encodeFunctionData({
                abi: leverageModuleAbi,
                functionName: 'announceLeverageClose',
                args: [
                    BigInt(positionId),      // Position ID
                    BigInt(minFillPrice),    // Minimum fill price
                    keeperFee                // Fee for keeper execution
                ]
            })
        };

        transactions.push(tx);

        await notify('Waiting for transaction confirmation...');
        
        const result = await sendTransactions({ chainId, account, transactions });
        
        return toResult(
            `Successfully submitted order to close position. ${result.data[result.data.length - 1].message}`
        );
    } catch (error) {
        const errorMessage = error instanceof Error 
            ? error.message 
            : 'An unknown error occurred';
        return toResult(`Error closing position: ${errorMessage}`, true);
    }
}


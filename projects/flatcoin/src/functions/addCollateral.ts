// functions/addCollateral.ts
import { EVM, EvmChain, FunctionOptions, FunctionReturn, toResult, Chain } from '@heyanon/sdk';
import { Address, encodeFunctionData } from 'viem';
import { ADDRESSES } from '../constants';
import { leverageModuleAbi } from '../abis/leverageModule';
import { getKeeperFee } from './getKeeperFee';

const { checkToApprove, getChainFromName } = EVM.utils;

// Define the props interface
interface Props {
    chainName: string;              // Network name (BASE)
    positionId: string;             // ID of the position to add collateral to
    additionalCollateral: string;   // Amount of additional rETH collateral to add
    account: Address;               // User's wallet address
}

/**
 * Adds more collateral to an existing leveraged position
 * @param props - The parameters including position ID and additional collateral amount
 * @param options - System tools for blockchain interactions
 * @returns Transaction result
 */
export async function addCollateral(
    { chainName, positionId, additionalCollateral, account }: Props,
    { notify, evm: { getProvider, sendTransactions } }: FunctionOptions
): Promise<FunctionReturn> {
    if (!account) return toResult('Wallet not connected', true);

    const chainId = getChainFromName(chainName as EvmChain);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);

    try {
        await notify('Preparing to add collateral to position...');
        const provider = getProvider(chainId);
        
        // Get keeper fee using the standalone function
        let keeperFee;
        try {
            keeperFee = await getKeeperFee(provider);
        } catch (feeError) {
            return toResult('Failed to get keeper fee', true);
        }

        const transactions: EVM.types.TransactionParams[] = [];
        const collateralAmountBigInt = BigInt(additionalCollateral);
        const addresses = ADDRESSES[Chain.BASE];

        // Check and prepare rETH approval if needed
        await checkToApprove({
            args: {
                account,
                target: addresses.RETH_TOKEN,
                spender: addresses.LEVERAGE_MODULE,
                amount: collateralAmountBigInt
            },
            provider,
            transactions
        });

        // Prepare add collateral transaction
        const tx: EVM.types.TransactionParams = {
            target: addresses.LEVERAGE_MODULE,
            data: encodeFunctionData({
                abi: leverageModuleAbi,
                functionName: 'announceAdjustMargin',
                args: [
                    BigInt(positionId),      // Position ID
                    collateralAmountBigInt,  // Additional collateral amount
                    0n,                      // No size adjustment
                    keeperFee                // Fee for keeper execution
                ]
            })
        };

        transactions.push(tx);

        await notify('Waiting for transaction confirmation...');
        
        const result = await sendTransactions({ chainId, account, transactions });
        
        return toResult(
            `Successfully submitted order to add collateral. ${result.data[result.data.length - 1].message}`
        );
    } catch (error) {
        const errorMessage = error instanceof Error 
            ? error.message 
            : 'An unknown error occurred';
        return toResult(`Error adding collateral: ${errorMessage}`, true);
    }
}


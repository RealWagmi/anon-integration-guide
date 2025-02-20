// functions/openLongPosition.ts
import { EVM, EvmChain, FunctionOptions, FunctionReturn, toResult, Chain } from '@heyanon/sdk';
import { Address, encodeFunctionData } from 'viem';
import { ADDRESSES } from '../constants';
import { leverageModuleAbi } from '../abis/leverageModule';
import { getKeeperFee } from './getKeeperFee';

const { checkToApprove, getChainFromName } = EVM.utils;

interface Props {
    chainName: string;          // Network name (BASE)
    marginAmount: string;       // Amount of rETH to deposit as margin
    leverage: string;           // Leverage multiplier (2x, 5x, 10x, 15x, or 25x)
    account: Address;           // User's wallet address
}

/**
 * Opens a new leveraged long position
 * @param props - The parameters including margin amount and leverage
 * @param options - System tools for blockchain interactions
 * @returns Transaction result
 */
export async function openLongPosition(
    { chainName, marginAmount, leverage, account }: Props,
    { notify, evm: { getProvider, sendTransactions } }: FunctionOptions
): Promise<FunctionReturn> {
    if (!account) return toResult('Wallet not connected', true);

    const chainId = getChainFromName(chainName as EvmChain);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);

    try {
        await notify('Preparing to open leveraged position...');
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
        const marginAmountBigInt = BigInt(marginAmount);
        const additionalSize = marginAmountBigInt * (BigInt(leverage) - 1n);

        // Check and prepare rETH approval if needed
        await checkToApprove({
            args: {
                account,
                target: addresses.RETH_TOKEN,
                spender: addresses.LEVERAGE_MODULE,
                amount: marginAmountBigInt
            },
            provider,
            transactions
        });

        // Prepare open position transaction
        const tx: EVM.types.TransactionParams = {
            target: addresses.LEVERAGE_MODULE,
            data: encodeFunctionData({
                abi: leverageModuleAbi,
                functionName: 'announceLeverageOpen',
                args: [
                    marginAmountBigInt,  // Margin amount
                    additionalSize,      // Additional size based on leverage
                    0n,                  // Max fill price (0 for market order)
                    keeperFee           // Fee for keeper execution
                ]
            })
        };

        transactions.push(tx);

        await notify('Waiting for transaction confirmation...');
        
        const result = await sendTransactions({ chainId, account, transactions });
        
        return toResult(
            `Successfully submitted order to open leveraged position. ${result.data[result.data.length - 1].message}`
        );
    } catch (error) {
        const errorMessage = error instanceof Error 
            ? error.message 
            : 'An unknown error occurred';
        return toResult(`Error opening position: ${errorMessage}`, true);
    }
}


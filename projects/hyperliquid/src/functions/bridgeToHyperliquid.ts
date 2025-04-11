import { Address, encodeFunctionData, parseUnits } from 'viem';
import { FunctionReturn, FunctionOptions, toResult, EVM, EvmChain } from '@heyanon/sdk';
import { HYPERLIQUID_BRIDGE_ADDRESS, USDC_ADDRESS, USDC_DECIMALS, MIN_BRIDGE_AMOUNT, ARBITRUM_CHAIN_ID } from '../constants';
import { erc20PermitAbi } from '../abis';

interface Props {
    chainName: string;
    account: Address;
    amount: string;
}

const { getChainFromName } = EVM.utils;

/**
 * Bridges USDC funds to Hyperliquid by transferring USDC directly to the bridge address
 * @param chainName - Name of the chain (must be Arbitrum)
 * @param account - User's wallet address
 * @param amount - Amount of USDC to bridge
 * @param options - SDK function options
 * @returns Promise resolving to function execution result
 */
export async function bridgeToHyperliquid({ chainName, account, amount }: Props, { notify, evm: { sendTransactions } }: FunctionOptions): Promise<FunctionReturn> {
    try {
        if (!account) {
            console.log('No account found');
            return toResult('Wallet not connected', true);
        }
        console.log('Starting bridge with:', { chainName, account, amount });

        // Validate chain
        const chainId = getChainFromName(chainName as EvmChain);
        console.log('Chain ID:', chainId);
        if (!chainId) {
            return toResult(`Unsupported chain name: ${chainName}`, true);
        }
        if (chainId !== ARBITRUM_CHAIN_ID) {
            return toResult(`Hyperliquid bridge is only supported on Arbitrum`, true);
        }

        // Validate amount
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount)) {
            return toResult('Invalid amount specified', true);
        }
        if (parsedAmount < MIN_BRIDGE_AMOUNT) {
            return toResult(`Minimum bridge amount is ${MIN_BRIDGE_AMOUNT} USDC`, true);
        }

        await notify('Preparing to bridge USDC to Hyperliquid...');

        const amountInWei = parseUnits(amount, USDC_DECIMALS);

        const tx: EVM.types.TransactionParams = {
            target: USDC_ADDRESS,
            data: encodeFunctionData({
                abi: erc20PermitAbi,
                functionName: 'transfer',
                args: [HYPERLIQUID_BRIDGE_ADDRESS, amountInWei],
            }),
        };

        await notify('Waiting for transaction confirmation...');
        const result = await sendTransactions({
            chainId,
            account,
            transactions: [tx],
        });
        console.log('Transaction result:', result);

        const transferMessage = result.data[result.data.length - 1];
        return toResult(result.isMultisig ? transferMessage.message : `Successfully bridged ${amount} USDC to Hyperliquid. ${transferMessage.message}`);
    } catch (error) {
        console.error('Bridge error:', error);
        return toResult('Failed to bridge funds to Hyperliquid. Please try again.', true);
    }
}

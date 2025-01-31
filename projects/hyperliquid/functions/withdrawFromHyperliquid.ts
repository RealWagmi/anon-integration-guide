import axios from 'axios';
import { Address } from 'viem';
import { FunctionReturn, FunctionOptions, toResult, getChainFromName } from '@heyanon/sdk';
import { ARBITRUM_CHAIN_ID, MIN_WITHDRAW_AMOUNT } from '../constants';

interface Props {
    chainName: string;
    account: Address;
    amount: string;
}

/**
 * Withdraws USDC funds from Hyperliquid by signing EIP-712 typed data
 * @param chainName - Name of the chain (must be Arbitrum)
 * @param account - User's wallet address
 * @param amount - Amount of USDC to withdraw
 * @param options - SDK function options
 * @returns Promise resolving to function execution result
 */
export async function withdrawFromHyperliquid({ chainName, account, amount }: Props, { signTypedDatas, notify }: FunctionOptions): Promise<FunctionReturn> {
    try {
        if (!account) {
            console.log('No account found');
            return toResult('Wallet not connected', true);
        }
        console.log('Starting withdraw with:', { chainName, account, amount });

        // Validate chain
        const chainId = getChainFromName(chainName);
        console.log('Chain ID:', chainId);
        if (!chainId) {
            return toResult(`Unsupported chain name: ${chainName}`, true);
        }
        if (chainId !== ARBITRUM_CHAIN_ID) {
            return toResult(`Withdrawing funds from Hyperliquid is only supported to Arbitrum`, true);
        }

        // Validate amount
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount)) {
            return toResult('Invalid amount specified', true);
        }
        if (parsedAmount < MIN_WITHDRAW_AMOUNT) {
            return toResult(`Minimum withdraw amount is ${MIN_WITHDRAW_AMOUNT} USDC`, true);
        }

        await notify('Preparing to withdraw USDC from Hyperliquid...');
        const nonce = Date.now();

        const types = {
            'HyperliquidTransaction:Withdraw': [
                { name: 'hyperliquidChain', type: 'string' },
                { name: 'destination', type: 'string' },
                { name: 'amount', type: 'string' },
                { name: 'time', type: 'uint64' },
            ],
        };

        const action = {
            type: 'withdraw3',
            hyperliquidChain: 'Mainnet',
            signatureChainId: '0xa4b1',
            amount,
            time: nonce,
            destination: account,
        };

        if (!signTypedDatas) {
            throw new Error('signTypedDatas is not available');
        }

        const signature = await signTypedDatas([{ primaryType: 'HyperliquidTransaction:Withdraw', types, message: action }]);

        const res = await axios.post(
            'https://api.hyperliquid.xyz/exchange',
            {
                action,
                nonce,
                signature,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            },
        );

        const data = res.data;

        if (data.status !== 'ok') {
            throw new Error(data);
        }

        return toResult(
            `Successfully initiated withdraw of ${amount} USDC from Hyperliquid to Arbitrum. You will have to wait approximately 5 minutes for the funds to arrive on Arbitrum.`,
        );
    } catch (error) {
        console.log('Withdraw error:', error);
        return toResult('Failed to withdraw funds from Hyperliquid. Please try again.', true);
    }
}

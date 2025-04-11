import axios from 'axios';
import { parseSignature, zeroAddress } from 'viem';
import { FunctionReturn, FunctionOptions, toResult } from '@heyanon/sdk';
import { ARBITRUM_CHAIN_ID, ARBITRUM_CHAIN_ID_HEX } from '../constants';

interface Props {
    amount: string;
}

/**
 * Transfers funds from user's perpetual (perp) balance to spot balance on Hyperliquid by signing EIP-712 typed data.
 * @param amount - Amount of USDC to transfer
 * @param options - SDK function options
 * @returns Promise resolving to function execution result
 */
export async function transferToSpot({ amount }: Props, { notify, evm: { signTypedDatas } }: FunctionOptions): Promise<FunctionReturn> {
    try {
        console.log('Starting perp->spot transfer with:', { amount });

        // Validate amount
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            return toResult('Invalid amount specified', true);
        }

        await notify('Preparing to transfer funds between spot and perp balances on Hyperliquid...');
        const nonce = Date.now();

        const types = {
            'HyperliquidTransaction:UsdClassTransfer': [
                { name: 'hyperliquidChain', type: 'string' },
                { name: 'amount', type: 'string' },
                { name: 'toPerp', type: 'bool' },
                { name: 'nonce', type: 'uint64' },
            ],
        };

        const action = {
            type: 'usdClassTransfer',
            hyperliquidChain: 'Mainnet',
            signatureChainId: ARBITRUM_CHAIN_ID_HEX,
            amount,
            toPerp: false,
            nonce,
        };

        if (!signTypedDatas) {
            throw new Error('signTypedDatas is not available');
        }

        const domain = {
            name: 'HyperliquidSignTransaction',
            version: '1',
            chainId: ARBITRUM_CHAIN_ID,
            verifyingContract: zeroAddress,
        };

        const signatureHex = await signTypedDatas([
            {
                domain,
                primaryType: 'HyperliquidTransaction:UsdClassTransfer',
                types,
                message: action,
            },
        ]);
        const signature = parseSignature(signatureHex[0]);
        let signatureSerializable;
        if (signature.v) {
            signatureSerializable = { r: signature.r, s: signature.s, yParity: signature.yParity, v: Number(signature.v) };
        } else {
            signatureSerializable = { r: signature.r, s: signature.s, yParity: signature.yParity };
        }
        const res = await axios.post(
            'https://api.hyperliquid.xyz/exchange',
            { action, nonce, signature: signatureSerializable },
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            },
        );

        const data = res.data;

        if (data.status !== 'ok') {
            throw new Error(data.response);
        }

        return toResult(`Successfully initiated transfer of ${amount} USDC from perp to spot on Hyperliquid.`);
    } catch (error) {
        console.log('Spot/Perp transfer error:', error);
        return toResult('Failed to transfer funds between spot and perp balances on Hyperliquid. Please try again.', true);
    }
}

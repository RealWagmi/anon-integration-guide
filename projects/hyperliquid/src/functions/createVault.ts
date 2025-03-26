import axios from 'axios';
import { Address, parseSignature, zeroAddress } from 'viem';
import { FunctionReturn, FunctionOptions, toResult } from '@heyanon/sdk';
import { ARBITRUM_CHAIN_ID, ARBITRUM_CHAIN_ID_HEX, hyperliquidPerps, MIN_HYPERLIQUID_TRADE_SIZE } from '../constants';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { _formatPrice } from './utils/_formatPrice';
import { _formatSize } from './utils/_formatSize';
import { _actionHash } from './utils/_actionHash';
import { _signL1Action } from './utils/_signL1Action';
import { _updateLeverage } from './utils/_updateLeverage';

interface Props {
    account: Address;
    description: string;
    initialUsd: number;
    name: string;
}

const VAULT_CREATION_FEE = 100;

/**
 * Create a new vault for perpetual trading
 * @param account - Creator's wallet address
 * @param description - Description of the vault
 * @param initialUsd - How many usd to deposit into vault initially
 * @param name - Name of the newly created vault
 * @param options - SDK function options
 * @returns Promise resolving to function execution result
 */
export async function createVault({ account, description, initialUsd, name }: Props, { evm: { signTypedDatas } }: FunctionOptions): Promise<FunctionReturn> {
    try {
        if (!name || !description || description.length < 10 || name.length < 3) return toResult('Provide name (min 3 characters) and description (min 10 characters)', true);
        if (initialUsd < 100) return toResult('Minimum vault size is 100$', true);
        const resultClearingHouseState = await axios.post(
            'https://api.hyperliquid.xyz/info',
            { type: 'clearinghouseState', user: account },
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            },
        );
        const { withdrawable } = resultClearingHouseState.data;

        if (initialUsd > withdrawable) return toResult('Not enough money', true);
        if (initialUsd + VAULT_CREATION_FEE > withdrawable) return toResult('Not enough funds to cover the vault creation fee of 100$ (non-refundable)', true);

        const privateKey = generatePrivateKey();
        const agentWallet = privateKeyToAccount(privateKey);
        {
            const nonce = Date.now();
            const action = {
                type: 'approveAgent',
                hyperliquidChain: 'Mainnet',
                signatureChainId: ARBITRUM_CHAIN_ID_HEX,
                agentAddress: agentWallet.address,
                agentName: 'funding_agent',
                nonce,
            };

            const types = {
                'HyperliquidTransaction:ApproveAgent': [
                    { name: 'hyperliquidChain', type: 'string' },
                    { name: 'agentAddress', type: 'address' },
                    { name: 'agentName', type: 'string' },
                    { name: 'nonce', type: 'uint64' },
                ],
            };

            const domain = {
                name: 'HyperliquidSignTransaction',
                version: '1',
                chainId: ARBITRUM_CHAIN_ID,
                verifyingContract: zeroAddress,
            };

            if (!signTypedDatas) {
                throw new Error('signTypedDatas is not available');
            }
            const signatureHex = await signTypedDatas([
                {
                    domain,
                    primaryType: 'HyperliquidTransaction:ApproveAgent',
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
            await axios.post(
                'https://api.hyperliquid.xyz/exchange',
                {
                    action,
                    nonce,
                    signature: signatureSerializable,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                },
            );
        }

        const nonce = Date.now();
        const action = {
            type: 'createVault',
            name,
            description,
            initialUsd: initialUsd * 1e6,
            nonce,
        };

        const signature = await _signL1Action(action, nonce, true, agentWallet);

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

        if (res.data.status === 'err') throw new Error(res?.data?.response);

        const errorMessage = res.data.response?.data?.statuses && (res.data.response.data.statuses[0]?.error || res.data.response.data.statuses[1]?.error);

        if (errorMessage) throw new Error(res?.data?.response);

        return toResult(`Successfully created vault!`);
    } catch (error) {
        console.log(error);
        return toResult('Failed to create vault on Hyperliquid. Please try again.', true);
    }
}

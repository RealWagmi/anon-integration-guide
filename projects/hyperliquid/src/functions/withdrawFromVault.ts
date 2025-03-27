import axios from 'axios';
import { Address, isAddress, parseSignature, zeroAddress } from 'viem';
import { FunctionReturn, FunctionOptions, toResult } from '@heyanon/sdk';
import { ARBITRUM_CHAIN_ID, ARBITRUM_CHAIN_ID_HEX } from '../constants';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { _formatPrice } from './utils/_formatPrice';
import { _formatSize } from './utils/_formatSize';
import { _actionHash } from './utils/_actionHash';
import { _signL1Action } from './utils/_signL1Action';
import { _updateLeverage } from './utils/_updateLeverage';
import { _getUsersVaultAddress } from './utils/_getUsersVaultAddress';
import { _getVaultAddress } from './utils/_getVaultAddress';

interface Props {
    account: Address;
    vault: string;
    usd: number;
}

/**
 * Withdraws funds from the vault that user has deposited into previously.
 * @param account - User's wallet address
 * @param vault - Vault that needs to be withdrawn from
 * @param usd - USD amount that should be withdrawn
 * @returns Promise resolving to function execution result
 */
export async function withdrawFromVault({ account, vault, usd }: Props, { evm: { signTypedDatas } }: FunctionOptions): Promise<FunctionReturn> {
    try {
        if (vault && !isAddress(vault)) {
            vault = await _getVaultAddress(vault);
            if (!vault) return toResult('Invalid vault specified', true);
        }

        const res2 = await axios.post(
            'https://api.hyperliquid.xyz/info',
            { type: 'vaultDetails', user: account, vaultAddress: vault },
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            },
        );

        const data = res2.data;

        if (usd < 10) {
            return toResult(`Minimum deposit value is 10$`, true);
        }
        if (usd > data.maxWithdrawable) {
            return toResult(`Your withdrawable balance in vault is ${data.maxWithdrawable}$`, true);
        }
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
            type: 'vaultTransfer',
            vaultAddress: vault,
            isDeposit: false,
            usd: Math.round(usd * 1000000),
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

        if (res.data.status === 'err') {
            if (res?.data?.response == 'Cannot withdraw during lockup period after depositing.') {
                return toResult('Cannot withdraw during lockup period after depositing.', true);
            }
            throw new Error(res?.data?.response);
        }

        const errorMessage = res.data.response?.data?.statuses && (res.data.response.data.statuses[0]?.error || res.data.response.data.statuses[1]?.error);

        if (errorMessage) throw new Error(res?.data?.response);

        return toResult(`Successfully withdrew from vault!`);
    } catch (error) {
        console.log(error);
        return toResult('Failed to withdraw from vault on Hyperliquid. Please try again.', true);
    }
}

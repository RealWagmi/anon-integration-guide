import { Address, PrivateKeyAccount } from 'viem';
import { _actionHash } from './_actionHash';
import { _signL1Action } from './_signL1Action';

/**
 * Updates the leverage on Hyperliquid for the selected asset
 */
export async function _updateLeverage(leverageAmount: number, assetIndex: number, agentWallet: PrivateKeyAccount, vaultAddress?: Address) {
    try {
        const action = {
            type: 'updateLeverage',
            asset: assetIndex,
            isCross: false,
            leverage: leverageAmount,
        };

        const nonce = Date.now();

        const signature = await _signL1Action(action, nonce, true, agentWallet, vaultAddress);
        const payload = {
            action: action,
            nonce: nonce,
            signature,
        };
        // @ts-ignore
        if (vaultAddress) payload.vaultAddress = vaultAddress;
        const result = await fetch('https://api.hyperliquid.xyz/exchange', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });
        const json = await result.json();
        return json?.status == 'ok';
    } catch (e) {
        return false;
    }
}

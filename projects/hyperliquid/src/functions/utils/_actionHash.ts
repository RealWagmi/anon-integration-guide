import { encode } from '@msgpack/msgpack';
import { Address, keccak256, toBytes } from 'viem';

/**
 * Computes keccak256 of the hyperliquid action
 */
export function _actionHash(action: any, nonce: number, vaultAddress?: Address): string {
    const msgPackBytes = encode(action);
    const additionalBytesLength = vaultAddress ? 29 : 9;
    const data = new Uint8Array(msgPackBytes.length + additionalBytesLength);
    data.set(msgPackBytes);
    const view = new DataView(data.buffer);
    view.setBigUint64(msgPackBytes.length, BigInt(nonce), false);
    if (!vaultAddress) {
        view.setUint8(msgPackBytes.length + 8, 0);
    } else {
        view.setUint8(msgPackBytes.length + 8, 1);
        data.set(toBytes(vaultAddress), msgPackBytes.length + 9);
    }
    return keccak256(data);
}

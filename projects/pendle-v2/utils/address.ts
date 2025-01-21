import { type Address } from 'viem';

export function validateAddress(address: Address): boolean {
    if (!address) return false;
    if (typeof address !== 'string') return false;
    if (!address.startsWith('0x')) return false;
    if (address.length !== 42) return false;
    return /^0x[0-9a-fA-F]{40}$/.test(address);
} 
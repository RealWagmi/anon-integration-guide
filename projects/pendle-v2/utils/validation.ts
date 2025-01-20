import { type Address } from 'viem';
import { ValidationError } from './errors';

export function validateAddress(address: Address): boolean {
    if (!address || address === '0x0000000000000000000000000000000000000000') {
        return false;
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
        return false;
    }
    return true;
}

export function validateChainName(chainName: string): void {
    const validChains = ['ethereum', 'arbitrum-one', 'sepolia'];
    if (!validChains.includes(chainName)) {
        throw new ValidationError(`Invalid chain name: ${chainName}`);
    }
} 
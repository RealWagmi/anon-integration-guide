import { type Address } from 'viem';
import { ValidationError } from './errors';

export function validateAddress(address: Address): void {
    if (!address || address === '0x0000000000000000000000000000000000000000') {
        throw new ValidationError('Invalid address: zero address');
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
        throw new ValidationError('Invalid address format');
    }
}

export function validateChainName(chainName: string): void {
    const validChains = ['ethereum', 'arbitrum-one', 'sepolia'];
    if (!validChains.includes(chainName)) {
        throw new ValidationError(`Invalid chain name: ${chainName}`);
    }
} 
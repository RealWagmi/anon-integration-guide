import { ChainId } from '@heyanon/sdk';
import { Address } from 'viem';
import { PendleError, ERRORS } from './errors';
import { supportedChains } from '../constants';

export function validateChain(chainId: ChainId): void {
    if (!supportedChains.includes(chainId)) {
        throw new PendleError('Chain not supported', ERRORS.INVALID_CHAIN);
    }
}

export function validateMarket(marketAddress: Address, isExpired: boolean): void {
    if (isExpired) {
        throw new PendleError('Market has expired', ERRORS.MARKET_EXPIRED);
    }
}

export function validateAmount(amount: bigint, balance: bigint): void {
    if (amount > balance) {
        throw new PendleError('Insufficient balance', ERRORS.INSUFFICIENT_BALANCE);
    }
} 
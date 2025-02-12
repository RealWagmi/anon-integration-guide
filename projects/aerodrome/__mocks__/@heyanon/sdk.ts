import { vi } from 'vitest';

export const toResult = vi.fn().mockImplementation((data: string, isError: boolean) => ({ data, success: !isError }));

export const getChainFromName = vi.fn().mockImplementation((chainName: string) => {
    switch (chainName) {
        case 'Base':
            return 8453;
        case 'Ethereum':
            return 1;
        default:
            return null;
    }
});

export const checkToApprove = vi.fn();

export enum ChainId {
    BASE = 8453,
}

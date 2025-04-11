import { describe, it, expect, vi, beforeEach } from 'vitest';
import { distributeVault } from '../distributeVault';
import { toResult } from '@heyanon/sdk';
import axios from 'axios';
import * as utils from '../utils/_getUsersVaultAddress';
import * as signUtils from '../utils/_signL1Action';
import { Address } from 'viem';

vi.mock('axios');
vi.mock('../utils/_getUsersVaultAddress');
vi.mock('../utils/_signL1Action');

const mockAxios = (axios as unknown) as { post: ReturnType<typeof vi.fn> };

const defaultProps = {
    account: '0x1234567890123456789012345678901234567890' as Address,
    vault: 'vaultName',
    usd: 50,
};

const mockClearinghouseResponse = {
    data: {
        marginSummary: {
            accountValue: 200,
        },
        withdrawable: 150,
    },
};
const signTypedDatas = vi.fn().mockResolvedValue([
    '0x9f8f577823132326a0b55dea300f5b2427f3affe5b9c11eeef1ebf969238038b56bf4176fd974312f8d074eb4a5250480c088897c416098decf89a0ceaaf7cc51c',
] as `0x${string}`[]);

const functionOptions = {
    evm: {
        signTypedDatas,
    },
};

describe('distributeVault', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        mockAxios.post = vi.fn((url, body) => {
            if (body?.type === 'clearinghouseState') {
                return Promise.resolve(mockClearinghouseResponse);
            }
            if (url.includes('exchange')) {
                return Promise.resolve({
                    data: {
                        status: 'ok',
                        response: {
                            data: {
                                statuses: [{}],
                            },
                        },
                    },
                });
            }
            return Promise.resolve({ data: {} });
        });

        vi.spyOn(utils, '_getUsersVaultAddress').mockResolvedValue('0xResolvedVaultAddress');
        vi.spyOn(signUtils, '_signL1Action').mockResolvedValue({} as any);
    });

    it('should distribute successfully from the vault', async () => {
        const result = await distributeVault(defaultProps, functionOptions as any);
        expect(result.success).toBe(true);
        expect(result.data).toContain('Successfully distributed vault funds');
    });

    it('should resolve vault name into address', async () => {
        const spy = vi.spyOn(utils, '_getUsersVaultAddress').mockResolvedValue('0xResolvedVaultAddress');
        const result = await distributeVault(defaultProps, functionOptions as any);
        expect(result.success).toBe(true);
        expect(spy).toHaveBeenCalled();
    });

    it('should return error if vault resolution fails', async () => {
        vi.spyOn(utils, '_getUsersVaultAddress').mockResolvedValue(null);
        const result = await distributeVault(defaultProps, functionOptions as any);
        expect(result).toEqual(toResult('Invalid vault specified', true));
    });

    it('should return error if amount is too low', async () => {
        const result = await distributeVault({ ...defaultProps, usd: 5 }, functionOptions as any);
        expect(result).toEqual(toResult('Minimum distribute value is 10$', true));
    });

    it('should return error if amount is too high', async () => {
        const result = await distributeVault({ ...defaultProps, usd: 9999 }, functionOptions as any);
        expect(result).toEqual(toResult(`Maximum distribute amount is 100$`, true)); // marginSummary.accountValue - 100 = 100
    });

    it('should return error if signTypedDatas is not available', async () => {
        const result = await distributeVault(defaultProps, { evm: {} } as any);
        expect(result.success).toBe(false);
        expect(result.data).toContain('Failed to distributed vault funds on Hyperliquid');
    });

    it('should return error if approveAgent post fails', async () => {
        mockAxios.post = vi.fn((url, body) => {
            if (body?.type === 'clearinghouseState') return Promise.resolve(mockClearinghouseResponse);
            if (url.includes('exchange') && body?.action?.type === 'approveAgent') {
                return Promise.reject(new Error('approveAgent failed'));
            }
            return Promise.resolve({ data: {} });
        });

        const result = await distributeVault(defaultProps, functionOptions as any);
        expect(result.success).toBe(false);
        expect(result.data).toContain('Failed to distributed vault funds on Hyperliquid');
    });

    it('should return error if vaultDistribute returns status=err', async () => {
        mockAxios.post = vi.fn((url, body) => {
            if (body?.type === 'clearinghouseState') return Promise.resolve(mockClearinghouseResponse);
            if (url.includes('exchange') && body?.action?.type === 'vaultDistribute') {
                return Promise.resolve({ data: { status: 'err', response: 'vaultDistribute error' } });
            }
            return Promise.resolve({ data: {} });
        });

        const result = await distributeVault(defaultProps, functionOptions as any);
        expect(result.success).toBe(false);
        expect(result.data).toContain('Failed to distributed vault funds on Hyperliquid');
    });

    it('should return error if vaultDistribute response contains error in statuses', async () => {
        mockAxios.post = vi.fn((url, body) => {
            if (body?.type === 'clearinghouseState') return Promise.resolve(mockClearinghouseResponse);
            if (url.includes('exchange') && body?.action?.type === 'vaultDistribute') {
                return Promise.resolve({
                    data: {
                        status: 'ok',
                        response: {
                            data: {
                                statuses: [{ error: 'error occurred' }],
                            },
                        },
                    },
                });
            }
            return Promise.resolve({ data: {} });
        });

        const result = await distributeVault(defaultProps, functionOptions as any);
        expect(result.success).toBe(false);
        expect(result.data).toContain('Failed to distributed vault funds on Hyperliquid');
    });

    it('should handle unexpected exceptions', async () => {
        mockAxios.post = vi.fn(() => {
            throw new Error('Network error');
        });

        const result = await distributeVault(defaultProps, functionOptions as any);
        expect(result.success).toBe(false);
        expect(result.data).toContain('Failed to distributed vault funds on Hyperliquid');
    });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { openPerp } from '../openPerp';
import { hyperliquidPerps, MIN_HYPERLIQUID_TRADE_SIZE } from '../../constants';
import { toResult } from '@heyanon/sdk';
import { Address } from 'viem';

vi.mock('axios', () => ({
    default: {
        post: vi.fn(),
    },
}));

vi.mock('viem/accounts', () => ({
    generatePrivateKey: vi.fn(() => 'dummy-private-key'),
    privateKeyToAccount: vi.fn(() => ({
        address: '0xAgentWalletAddress',
        signTypedData: vi.fn(() =>
            Promise.resolve('0x9f8f577823132326a0b55dea300f5b2427f3affe5b9c11eeef1ebf969238038b56bf4176fd974312f8d074eb4a5250480c088897c416098decf89a0ceaaf7cc51c'),
        ),
    })),
}));

global.fetch = vi.fn();

import axios from 'axios';
const mockedAxios = axios as unknown as { post: ReturnType<typeof vi.fn> };

const account = '0x92CC36D66e9d739D50673d1f27929a371FB83a67' as Address;

const defaultProps = {
    account,
    asset: 'ETH' as const,
    size: '100',
    sizeUnit: 'USD' as const,
    leverage: 10,
    short: false,
};

const perpInfo = hyperliquidPerps['ETH'] || {
    assetIndex: 0,
    decimals: 2,
    nSigFigs: 4,
};

describe('openPerp', () => {
    const mockNotify = vi.fn((message: string) => Promise.resolve());
    const mockSignTypedDatas = vi
        .fn()
        .mockResolvedValue([
            '0x9f8f577823132326a0b55dea300f5b2427f3affe5b9c11eeef1ebf969238038b56bf4176fd974312f8d074eb4a5250480c088897c416098decf89a0ceaaf7cc51c',
        ] as `0x${string}`[]);

    const functionOptions = {
        notify: mockNotify,
        evm: {
            signTypedDatas: mockSignTypedDatas,
        },
    };

    function setupAxiosResponses(responses: any[]) {
        mockedAxios.post.mockReset();
        responses.forEach((response) => {
            mockedAxios.post.mockImplementationOnce(() => Promise.resolve(response));
        });
    }

    beforeEach(() => {
        vi.clearAllMocks();
        (global.fetch as ReturnType<typeof vi.fn>).mockReset();
    });

    it('should prepare and send the transaction correctly and return a success message', async () => {
        setupAxiosResponses([
            {
                data: { assetPositions: [], withdrawable: '10000' },
            },
            {
                data: [{}, { [perpInfo.assetIndex]: { midPx: '200' } }],
            },
            { data: { status: 'ok' } },
            {
                data: {
                    status: 'ok',
                    response: {
                        data: {
                            statuses: [{ filled: { totalSz: '1', avgPx: '205' } }, {}],
                        },
                    },
                },
            },
        ]);

        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
            json: () => Promise.resolve({}),
        });

        const result = await openPerp(defaultProps, functionOptions as any);

        expect(result.success).toBe(true);
        expect(result.data).toContain(`Successfully bought ${defaultProps.size} USD of ${defaultProps.asset} with ${defaultProps.leverage}x leverage`);
    });

    it('should handle signature without v parameter', async () => {
        mockSignTypedDatas.mockResolvedValueOnce([
            '0x7f8f577823132326a0b55dea300f5b2427f3affe5b9c11eeef1ebf969238038b56bf4176fd974312f8d074eb4a5250480c088897c416098decf89a0ceaaf7cc501',
        ] as `0x${string}`[]);

        setupAxiosResponses([
            {
                data: { assetPositions: [], withdrawable: '1000' },
            },
            {
                data: [{}, { [perpInfo.assetIndex]: { midPx: '100' } }],
            },
            { data: { status: 'ok' } },
            {
                data: {
                    status: 'ok',
                    response: {
                        data: {
                            statuses: [{ filled: { totalSz: '1', avgPx: '100' } }],
                        },
                    },
                },
            },
        ]);

        const result = await openPerp(defaultProps, functionOptions as any);

        expect(result.success).toBe(true);
    });

    it('should return error if user already has a perp open', async () => {
        setupAxiosResponses([
            {
                data: {
                    assetPositions: [{ position: { coin: defaultProps.asset } }],
                    withdrawable: '1000',
                },
            },
        ]);

        const result = await openPerp(defaultProps, functionOptions as any);

        expect(result).toEqual(toResult('You already have a perp in that asset, close it in order to open a new one.', true));
    });

    it('should return error if order size in USD is below the minimum', async () => {
        setupAxiosResponses([
            {
                data: {
                    assetPositions: [],
                    withdrawable: '1000',
                },
            },
            {
                data: [{}, { [perpInfo.assetIndex]: { midPx: '1000' } }],
            },
        ]);

        const smallOrderProps = { ...defaultProps, size: '5', sizeUnit: 'USD' as const };
        const result = await openPerp(smallOrderProps, functionOptions as any);

        expect(result).toEqual(toResult(`Minimum order size is ${MIN_HYPERLIQUID_TRADE_SIZE}$`, true));
    });

    it('should return error if not enough withdrawable funds are available', async () => {
        setupAxiosResponses([
            {
                data: {
                    assetPositions: [],
                    withdrawable: '50',
                },
            },
            {
                data: [{}, { [perpInfo.assetIndex]: { midPx: '10' } }],
            },
        ]);

        const props = { ...defaultProps, size: '1000', sizeUnit: 'USD' as const, leverage: 2 };
        const result = await openPerp(props, functionOptions as any);

        expect(result).toEqual(toResult('Not enough USD on Hyperliquid', true));
    });

    it('should return error if signTypedDatas is not available during approveAgent', async () => {
        setupAxiosResponses([
            {
                data: {
                    assetPositions: [],
                    withdrawable: '1000',
                },
            },
            {
                data: [{}, { [perpInfo.assetIndex]: { midPx: '100' } }],
            },
        ]);

        const result = await openPerp(defaultProps, {
            notify: mockNotify,
            evm: {},
        } as any);

        expect(result).toEqual(toResult('Failed to open position on Hyperliquid. Please try again.', true));
    });

    it('should return error if the approveAgent axios post fails', async () => {
        mockedAxios.post.mockReset();
        mockedAxios.post
            .mockResolvedValueOnce({
                data: { assetPositions: [], withdrawable: '1000' },
            })
            .mockResolvedValueOnce({
                data: [{}, { [perpInfo.assetIndex]: { midPx: '100' } }],
            })
            .mockRejectedValueOnce(new Error('ApproveAgent network error'));

        const result = await openPerp(defaultProps, functionOptions as any);

        expect(result).toEqual(toResult('Failed to open position on Hyperliquid. Please try again.', true));
    });

    it('should return error if the order call returns a status "err"', async () => {
        setupAxiosResponses([
            {
                data: { assetPositions: [], withdrawable: '1000' },
            },
            {
                data: [{}, { [perpInfo.assetIndex]: { midPx: '100' } }],
            },
            { data: { status: 'ok' } },
            { data: { status: 'err', response: 'error response' } },
        ]);

        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
            json: () => Promise.resolve({}),
        });

        const result = await openPerp(defaultProps, functionOptions as any);

        expect(result).toEqual(toResult('Failed to open position on Hyperliquid. Please try again.', true));
    });

    it('should return error if order response statuses contain error messages', async () => {
        setupAxiosResponses([
            {
                data: { assetPositions: [], withdrawable: '1000' },
            },
            {
                data: [{}, { [perpInfo.assetIndex]: { midPx: '100' } }],
            },
            { data: { status: 'ok' } },
            {
                data: {
                    status: 'ok',
                    response: {
                        data: {
                            statuses: [{ error: 'Order rejected' }, { error: '' }],
                        },
                    },
                },
            },
        ]);

        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
            json: () => Promise.resolve({}),
        });

        const result = await openPerp(defaultProps, functionOptions as any);

        expect(result).toEqual(toResult('Failed to open position on Hyperliquid. Please try again.', true));
    });

    it('should return error if order response filled size is "0"', async () => {
        setupAxiosResponses([
            {
                data: { assetPositions: [], withdrawable: '1000' },
            },
            {
                data: [{}, { [perpInfo.assetIndex]: { midPx: '100' } }],
            },
            { data: { status: 'ok' } },
            {
                data: {
                    status: 'ok',
                    response: {
                        data: {
                            statuses: [{ filled: { totalSz: '0', avgPx: '0' } }, {}],
                        },
                    },
                },
            },
        ]);

        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
            json: () => Promise.resolve({}),
        });

        const result = await openPerp(defaultProps, functionOptions as any);

        expect(result).toEqual(toResult('Failed to open position on Hyperliquid. Please try again.', true));
    });

    it('should correctly calculate size when using ASSET unit', async () => {
        setupAxiosResponses([
            {
                data: { assetPositions: [], withdrawable: '10000' },
            },
            {
                data: [{}, { [perpInfo.assetIndex]: { midPx: '200' } }],
            },
            { data: { status: 'ok' } },
            {
                data: {
                    status: 'ok',
                    response: {
                        data: {
                            statuses: [{ filled: { totalSz: '1', avgPx: '205' } }, {}],
                        },
                    },
                },
            },
        ]);

        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
            json: () => Promise.resolve({}),
        });

        const assetUnitProps = {
            ...defaultProps,
            sizeUnit: 'ASSET' as const,
        };

        const result = await openPerp(assetUnitProps, functionOptions as any);

        expect(result.success).toBe(true);
        expect(result.data).toContain(`Successfully bought ${assetUnitProps.size}  ${assetUnitProps.asset} with ${assetUnitProps.leverage}x leverage`);
    });

    it('should handle response with no filled data in any statuses', async () => {
        setupAxiosResponses([
            {
                data: { assetPositions: [], withdrawable: '5000' },
            },
            {
                data: [{}, { [perpInfo.assetIndex]: { midPx: '200' } }],
            },
            { data: { status: 'ok' } },
            {
                data: {
                    status: 'ok',
                    response: {
                        data: {
                            statuses: [
                                {
                                    /* No filled property here */
                                },
                                {
                                    /* No filled property here */
                                },
                            ],
                        },
                    },
                },
            },
        ]);

        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
            json: () => Promise.resolve({}),
        });

        const consoleLogSpy = vi.spyOn(console, 'log');

        const result = await openPerp(defaultProps, functionOptions as any);

        expect(result.success).toBe(false);
        expect(result.data).toContain('Failed to open position on Hyperliquid');

        expect(consoleLogSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                message: 'Could not open order',
            }),
        );
    });
});

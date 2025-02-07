import axios from 'axios';
import { Address } from 'viem';
import { toResult } from '@heyanon/sdk';
import { closePerp } from '../functions/closePerp';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// We'll use the actual implementation of openPerp, so remove any mocks for it.

// Mock global.fetch used in _updateLeverage (inside openPerp)
global.fetch = jest.fn();

const account = '0x92CC36D66e9d739D50673d1f27929a371FB83a67' as Address;
const asset = 'ETH';

// Default SDK options for tests.
const mockNotify = jest.fn((message: string) => Promise.resolve());
const mockGetProvider = jest.fn();
const mockSendTransactions = jest.fn();
const mockSignMessages = jest.fn();
const mockSignTypedDatas = jest.fn(() =>
    Promise.resolve(['0x9f8f577823132326a0b55dea300f5b2427f3affe5b9c11eeef1ebf969238038b56bf4176fd974312f8d074eb4a5250480c088897c416098decf89a0ceaaf7cc51c' as `0x${string}`]),
);

const sdkOptions = {
    notify: mockNotify,
    getProvider: mockGetProvider,
    sendTransactions: mockSendTransactions,
    signMessages: mockSignMessages,
    signTypedDatas: mockSignTypedDatas,
};

/**
 * Helper to set up a sequence of axios.post responses.
 * This will replace the implementation of axios.post for each call in sequence.
 */
function setupAxiosPostResponses(responses: any[]) {
    mockedAxios.post.mockReset();
    responses.forEach((response) => {
        mockedAxios.post.mockImplementationOnce(() => Promise.resolve(response));
    });
}

describe('closePerp (integration with openPerp branches)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (global.fetch as jest.Mock).mockReset();
    });

    it("should return an error if the user doesn't have a perp in that asset", async () => {
        setupAxiosPostResponses([
            {
                data: {
                    assetPositions: [],
                    withdrawable: '1000',
                },
            },
        ]);

        const result = await closePerp({ account, asset }, sdkOptions);
        expect(result).toEqual(toResult("You don't have a perp in that asset.", true));
        expect(axios.post).toHaveBeenCalledWith(
            'https://api.hyperliquid.xyz/info',
            { type: 'clearinghouseState', user: account },
            { headers: { 'Content-Type': 'application/json' } },
        );
    });

    it('should return error if openPerp (called by closePerp) fails in its order step', async () => {
        setupAxiosPostResponses([
            // Call 1: closePerp clearinghouseState
            {
                data: {
                    assetPositions: [
                        {
                            position: {
                                coin: asset,
                                szi: '-10',
                                leverage: { value: 5 },
                            },
                        },
                    ],
                    withdrawable: '1000',
                },
            },
            // Call 2: openPerp clearinghouseState (redundant call inside openPerp)
            {
                data: {
                    assetPositions: [
                        {
                            position: {
                                coin: asset,
                                szi: '-10',
                                leverage: { value: 5 },
                            },
                        },
                    ],
                    withdrawable: '1000',
                },
            },
            // Call 3: metaAndAssetCtxs
            {
                data: [
                    {},
                    {
                        0: { midPx: '100' },
                    },
                ],
            },
            // Call 4: approveAgent
            {
                data: { status: 'ok' },
            },
            // Call 5: order call returns error status.
            {
                data: { status: 'err', response: 'order error response' },
            },
        ]);

        const result = await closePerp({ account, asset }, sdkOptions);
        expect(result).toEqual(toResult('Failed to close position on Hyperliquid. Please try again.', true));
    });

    it('should return success if openPerp (called by closePerp) succeeds', async () => {
        setupAxiosPostResponses([
            // Call 1: closePerp clearinghouseState
            {
                data: {
                    assetPositions: [
                        {
                            position: {
                                coin: asset,
                                szi: '15',
                                leverage: { value: 3 },
                            },
                        },
                    ],
                    withdrawable: '10000',
                },
            },
            // Call 2: openPerp clearinghouseState
            {
                data: {
                    assetPositions: [
                        {
                            position: {
                                coin: asset,
                                szi: '15',
                                leverage: { value: 3 },
                            },
                        },
                    ],
                    withdrawable: '10000',
                },
            },
            // Call 3: metaAndAssetCtxs
            {
                data: [
                    {},
                    {
                        1: { midPx: '200' },
                    },
                ],
            },
            // Call 4: approveAgent
            {
                data: { status: 'ok' },
            },
            // Call 5: order call returns success.
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

        (global.fetch as jest.Mock).mockResolvedValue({
            json: () => Promise.resolve({}),
        });

        const result = await closePerp({ account, asset }, sdkOptions);

        expect(result).toEqual(toResult('Successfully closed position.'));
    });

    it('should return error if the initial axios.post (clearinghouseState) fails', async () => {
        mockedAxios.post.mockReset();
        mockedAxios.post.mockRejectedValueOnce(new Error('Network error'));
        const result = await closePerp({ account, asset }, sdkOptions);
        expect(result).toEqual(toResult('Failed to close position on Hyperliquid. Please try again.', true));
    });
});

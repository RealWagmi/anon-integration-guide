import axios from 'axios';
import { Address } from 'viem';
import { openPerp } from '../functions';
import { hyperliquidPerps, MIN_HYPERLIQUID_TRADE_SIZE } from '../constants';
import { toResult } from '@heyanon/sdk';

// Mock axios and global fetch
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
global.fetch = jest.fn();

// Mock viem/accounts to control agent wallet behavior.
jest.mock('viem/accounts', () => ({
    generatePrivateKey: jest.fn(() => 'dummy-private-key'),
    privateKeyToAccount: jest.fn(() => ({
        address: '0xAgentWalletAddress',
        // Simulate signTypedData returning a dummy signature.
        signTypedData: jest.fn(() =>
            Promise.resolve('0x9f8f577823132326a0b55dea300f5b2427f3affe5b9c11eeef1ebf969238038b56bf4176fd974312f8d074eb4a5250480c088897c416098decf89a0ceaaf7cc51c'),
        ),
    })),
}));

const account = '0x92CC36D66e9d739D50673d1f27929a371FB83a67' as Address;

// Default properties for a successful openPerp call.
// No need to test the "closing" parameter here.
const defaultProps = {
    account,
    asset: 'ETH' as const,
    size: '100', // interpreted as USD or asset based on sizeUnit
    sizeUnit: 'USD' as const,
    leverage: 10,
    short: false,
    // "closing" is omitted because it is tested separately.
};

// Retrieve perp info for asset "ETH" from hyperliquidPerps.
const perpInfo = hyperliquidPerps['ETH'] || {
    assetIndex: 0,
    decimals: 2,
    nSigFigs: 4,
};

describe('openPerp', () => {
    // Example of mock signTypedDatas using the new signature format.
    const mockSignTypedDatasExample = jest.fn((...args: unknown[]) => {
        return Promise.resolve([
            '0x9f8f577823132326a0b55dea300f5b2427f3affe5b9c11eeef1ebf969238038b56bf4176fd974312f8d074eb4a5250480c088897c416098decf89a0ceaaf7cc51c',
        ] as `0x${string}`[]);
    });

    // Dummy notify function.
    const mockNotify = jest.fn((message: string) => {
        return Promise.resolve();
    });

    // Dummy provider and transaction sender.
    const mockGetProvider = jest.fn();
    const mockSendTransactions = jest.fn();

    // Helper to set up a sequence of axios.post responses.
    function setupAxiosResponses(responses: any[]) {
        mockedAxios.post.mockReset();
        responses.forEach((response) => {
            mockedAxios.post.mockImplementationOnce(() => Promise.resolve(response));
        });
    }

    beforeEach(() => {
        jest.clearAllMocks();
        (global.fetch as jest.Mock).mockReset();
    });

    it('should prepare and send the transaction correctly and return a success message', async () => {
        // Successful sequence:
        // 1. clearinghouseState returns no open positions and sufficient withdrawable funds.
        // 2. metaAndAssetCtxs returns a valid midPx.
        // 3. ApproveAgent succeeds.
        // 4. Order call returns statuses with a valid filled order.
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

        (global.fetch as jest.Mock).mockResolvedValue({
            json: () => Promise.resolve({}),
        });

        const result = await openPerp(defaultProps, {
            notify: mockNotify,
            getProvider: mockGetProvider,
            sendTransactions: mockSendTransactions,
            signMessages: jest.fn(),
            signTypedDatas: mockSignTypedDatasExample,
        });

        expect(result.success).toEqual(true);
        expect(result.data).toContain(`Successfully bought ${defaultProps.size} ${defaultProps.asset} with ${defaultProps.leverage}x leverage`);
    });

    it('should handle signature without v parameter', async () => {
        const mockSignTypedDatas = jest
            .fn()
            .mockResolvedValue([
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

        const result = await openPerp(defaultProps, {
            notify: mockNotify,
            getProvider: mockGetProvider,
            sendTransactions: mockSendTransactions,
            signMessages: jest.fn(),
            signTypedDatas: mockSignTypedDatas,
        });

        expect(result.success).toEqual(true);
    });

    it('should return error if user already has a perp open', async () => {
        // First axios call: clearinghouseState returns an open position for the asset.
        setupAxiosResponses([
            {
                data: {
                    assetPositions: [{ position: { coin: defaultProps.asset } }],
                    withdrawable: '1000',
                },
            },
        ]);

        const result = await openPerp(defaultProps, {
            notify: mockNotify,
            getProvider: mockGetProvider,
            sendTransactions: mockSendTransactions,
            signMessages: jest.fn(),
            signTypedDatas: mockSignTypedDatasExample,
        });

        expect(result).toEqual(toResult('You already have a perp in that asset, close it in order to open a new one.', true));
    });

    it('should return error if order size in USD is below the minimum', async () => {
        // Setup: clearinghouseState returns no open positions.
        setupAxiosResponses([
            {
                data: {
                    assetPositions: [],
                    withdrawable: '1000',
                },
            },
            // metaAndAssetCtxs call: provide a midPx so that the USD size is below $11.
            {
                data: [{}, { [perpInfo.assetIndex]: { midPx: '1000' } }],
            },
        ]);

        const smallOrderProps = { ...defaultProps, size: '5', sizeUnit: 'USD' as 'USD' | 'ASSET' };
        const result = await openPerp(smallOrderProps, {
            notify: mockNotify,
            getProvider: mockGetProvider,
            sendTransactions: mockSendTransactions,
            signMessages: jest.fn(),
            signTypedDatas: mockSignTypedDatasExample,
        });

        expect(result).toEqual(toResult(`Minimum order size is ${MIN_HYPERLIQUID_TRADE_SIZE}$`, true));
    });

    it('should return error if not enough withdrawable funds are available', async () => {
        // Setup: withdrawable funds are too low.
        setupAxiosResponses([
            {
                data: {
                    assetPositions: [],
                    withdrawable: '50', // low funds
                },
            },
            {
                data: [{}, { [perpInfo.assetIndex]: { midPx: '10' } }],
            },
        ]);

        // For a USD order, with size "1000" and leverage 2, the required funds exceed withdrawable.
        const props = { ...defaultProps, size: '1000', sizeUnit: 'USD' as 'USD' | 'ASSET', leverage: 2 };
        const result = await openPerp(props, {
            notify: mockNotify,
            getProvider: mockGetProvider,
            sendTransactions: mockSendTransactions,
            signMessages: jest.fn(),
            signTypedDatas: mockSignTypedDatasExample,
        });

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
            getProvider: mockGetProvider,
            sendTransactions: mockSendTransactions,
            signMessages: jest.fn(),
            signTypedDatas: undefined, // missing signTypedDatas
        });

        expect(result).toEqual(toResult('Failed to open position on Hyperliquid. Please try again.', true));
    });

    it('should return error if the approveAgent axios post fails', async () => {
        // Setup sequence:
        // 1. clearinghouseState and metaAndAssetCtxs succeed.
        // 2. ApproveAgent call fails.
        mockedAxios.post.mockReset();
        mockedAxios.post
            // clearinghouseState
            .mockResolvedValueOnce({
                data: { assetPositions: [], withdrawable: '1000' },
            })
            // metaAndAssetCtxs
            .mockResolvedValueOnce({
                data: [{}, { [perpInfo.assetIndex]: { midPx: '100' } }],
            })
            // approveAgent call fails.
            .mockRejectedValueOnce(new Error('ApproveAgent network error'));

        const result = await openPerp(defaultProps, {
            notify: mockNotify,
            getProvider: mockGetProvider,
            sendTransactions: mockSendTransactions,
            signMessages: jest.fn(),
            signTypedDatas: mockSignTypedDatasExample,
        });

        expect(result).toEqual(toResult('Failed to open position on Hyperliquid. Please try again.', true));
    });

    it('should return error if the order call returns a status "err"', async () => {
        // Setup sequence:
        // 1. clearinghouseState
        // 2. metaAndAssetCtxs
        // 3. ApproveAgent succeeds.
        // 4. Order call returns { status: 'err', response: 'error response' }.
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

        // Also mock fetch for _updateLeverage.
        (global.fetch as jest.Mock).mockResolvedValue({
            json: () => Promise.resolve({}),
        });

        const result = await openPerp(defaultProps, {
            notify: mockNotify,
            getProvider: mockGetProvider,
            sendTransactions: mockSendTransactions,
            signMessages: jest.fn(),
            signTypedDatas: mockSignTypedDatasExample,
        });

        expect(result).toEqual(toResult('Failed to open position on Hyperliquid. Please try again.', true));
    });

    it('should return error if order response statuses contain error messages', async () => {
        // Setup sequence:
        // 1. clearinghouseState
        // 2. metaAndAssetCtxs
        // 3. ApproveAgent succeeds.
        // 4. Order call returns statuses with an error message.
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

        (global.fetch as jest.Mock).mockResolvedValue({
            json: () => Promise.resolve({}),
        });

        const result = await openPerp(defaultProps, {
            notify: mockNotify,
            getProvider: mockGetProvider,
            sendTransactions: mockSendTransactions,
            signMessages: jest.fn(),
            signTypedDatas: mockSignTypedDatasExample,
        });

        expect(result).toEqual(toResult('Failed to open position on Hyperliquid. Please try again.', true));
    });

    it('should return error if order response filled size is "0"', async () => {
        // Setup sequence:
        // 1. clearinghouseState
        // 2. metaAndAssetCtxs
        // 3. ApproveAgent succeeds.
        // 4. Order call returns statuses with filled.totalSz equal to "0".
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

        (global.fetch as jest.Mock).mockResolvedValue({
            json: () => Promise.resolve({}),
        });

        const result = await openPerp(defaultProps, {
            notify: mockNotify,
            getProvider: mockGetProvider,
            sendTransactions: mockSendTransactions,
            signMessages: jest.fn(),
            signTypedDatas: mockSignTypedDatasExample,
        });

        expect(result).toEqual(toResult('Failed to open position on Hyperliquid. Please try again.', true));
    });
});

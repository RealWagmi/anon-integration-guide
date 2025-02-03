import { Address } from 'viem';
import { getBridgeQuote } from '../functions';
import { fetchBridgeQuote } from '../constants';

describe('getBridgeQuote', () => {
    jest.mock('../constants', () => ({
        ...jest.requireActual('../constants'), // Preserve other exports
        fetchBridgeQuote: jest.fn(), // Mock fetchBridgeQuote explicitly
    }));
    const mockNotify = jest.fn((message: string) => {
        console.log(message);
        return Promise.resolve();
    });

    const mockProvider = jest.fn().mockReturnValue({
        readContract: jest.fn(),
        simulateContract: jest.fn(),
    });

    // Set up fetch mock
    const mockFetch = jest.spyOn(global, 'fetch').mockImplementation(
        jest.fn(() =>
            Promise.resolve({
                ok: true,
                json: () =>
                    Promise.resolve({
                        data: {
                            getBridgeQuoteByTokenAddress: {
                                estimatedRecievedAmount: '29000000000000000',
                                quoteAmount: '30000000000000000',
                                minimumReceived: '28000000000000000',
                            },
                        },
                    }),
            }),
        ) as jest.Mock,
    );

    beforeEach(() => {
        jest.clearAllMocks();
    });

    const props = {
        srcChainName: 'base',
        destChainName: 'bitcoin',
        srcToken: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' as Address,
        destToken: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' as Address,
        slippage: 0.5,
        amount: '30000000000000000',
        srcTokenDecimals: 18,
        destTokenDecimals: 8,
    };

    it('Should get bridge quote correctly', async () => {
        const mockSendTransactions = jest.fn(() => {
            throw new Error('Transaction failed');
        });
        const result = await getBridgeQuote(props, {
            sendTransactions: mockSendTransactions,
            notify: mockNotify,
            getProvider: mockProvider,
        });

        expect(mockNotify).toHaveBeenCalledWith('Fetching bridge quote 🚀');
        expect(result.success).toEqual(true);
    });

    it('Should handle unsupported chain name for source chain', async () => {
        const mockSendTransactions = jest.fn(() => {
            throw new Error('Transaction failed');
        });
        const result = await getBridgeQuote({ ...props, srcChainName: 'kava' }, { notify: mockNotify, getProvider: mockProvider, sendTransactions: mockSendTransactions });
        expect(result.data).toContain('Eddy Finance is not supported on kava');
    });

    it('Should handle unsupported chain name for destination chain', async () => {
        const mockSendTransactions = jest.fn(() => {
            throw new Error('Transaction failed');
        });
        const result = await getBridgeQuote({ ...props, destChainName: 'iota' }, { notify: mockNotify, getProvider: mockProvider, sendTransactions: mockSendTransactions });
        expect(result.data).toContain('Eddy Finance is not supported on iota');
    });

    it('Should handle zero amount', async () => {
        const mockSendTransactions = jest.fn();
        const result = await getBridgeQuote({ ...props, amount: '0' }, { notify: mockNotify, getProvider: mockProvider, sendTransactions: mockSendTransactions });
        expect(result.data).toContain('Amount must be greater than 0');
    });

    it('Should handle fetchBridgeQuote errors', async () => {
        mockFetch.mockImplementationOnce(() => Promise.reject(new Error('Error fetching bridge quote:')));
        const mockSendTransactions = jest.fn();
        const result = await getBridgeQuote(props, {
            notify: mockNotify,
            getProvider: mockProvider,
            sendTransactions: mockSendTransactions,
        });

        expect(result.data).toContain('Failed to fetch Quote for transaction. Please try again.');
    });

    it('Should handle HTTP errors', async () => {
        mockFetch.mockImplementationOnce(() =>
            Promise.resolve({
                ok: false,
                status: 500,
            } as Response),
        );

        await expect(fetchBridgeQuote(props.srcToken, props.destToken, props.amount, props.slippage, 1, 8453)).rejects.toThrow('HTTP error! Status: 500');
    });

    it('Should handle invalid response data', async () => {
        mockFetch.mockImplementationOnce(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ data: undefined }),
            } as Response),
        );

        await expect(fetchBridgeQuote(props.srcToken, props.destToken, props.amount, props.slippage, 1, 8453)).rejects.toThrow('Invalid response: {}');
    });

    it('should set destChainId to BTC_CHAIN_ID when destChainName is "bitcoin"', async () => {
        const mockSendTransactions = jest.fn();
        await getBridgeQuote(
            { ...props, destChainName: 'bitcoin', destTokenDecimals: 8 },
            { notify: mockNotify, getProvider: mockProvider, sendTransactions: mockSendTransactions },
        );

        expect(mockNotify).toHaveBeenCalledWith('Fetching bridge quote 🚀');
    });
});

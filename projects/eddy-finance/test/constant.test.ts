import {
    getNativeTokenName,
    fetchBridgeQuote,
    fetchPrice,
    getZRC20Address,
    getZRC20ForNativeToken,
    getDataForCrossChain,
    getDataForBitcoin,
    supportedChains,
    EDDY_CROSS_CHAIN_BRIDGE,
    BTC_ZRC20,
    USDC_ZRC20,
    USDT_ZRC20,
    DAI_ZRC20,
    PEPE_ZRC20,
    ETH_ZRC20,
} from '../constants';
import { Address } from 'viem';
import { ChainId } from '@heyanon/sdk';

describe('Constants and Utility Functions', () => {
    jest.mock('../constants', () => ({
        ...jest.requireActual('../constants'), // Preserve other exports
        fetchBridgeQuote: jest.fn(), // Mock fetchBridgeQuote explicitly
        fetchPrice: jest.fn(),
    }));
    // Fetch mock setup
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
                            getDollarValueFromAddress: {
                                price: '9793937353541',
                                expo: '-8',
                            },
                        },
                    }),
            }),
        ) as jest.Mock,
    );

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // Existing Native Token Name Tests
    describe('getNativeTokenName', () => {
        it('should return ETH for Ethereum chain', () => {
            expect(getNativeTokenName(ChainId.ETHEREUM)).toBe('ETH');
        });

        it('should return BNB for BSC chain', () => {
            expect(getNativeTokenName(ChainId.BSC)).toBe('BNB');
        });

        it('should return POL for Polygon chain', () => {
            expect(getNativeTokenName(ChainId.POLYGON)).toBe('POL');
        });

        it('should return ETH for Base chain', () => {
            expect(getNativeTokenName(ChainId.BASE)).toBe('ETH');
        });

        it('should return "Not supported" for unsupported chains', () => {
            expect(getNativeTokenName(999999)).toBe('Not supported');
            expect(getNativeTokenName(-1)).toBe('Not supported');
            expect(getNativeTokenName(0)).toBe('Not supported');
        });
    });

    // getZRC20Address Tests
    describe('getZRC20Address', () => {
        it('should return correct ZRC20 address for supported tokens', () => {
            expect(getZRC20Address('USDT')).toBe(USDT_ZRC20);
            expect(getZRC20Address('usdt')).toBe(USDT_ZRC20);
            expect(getZRC20Address('USDC')).toBe(USDC_ZRC20);
            expect(getZRC20Address('usdc')).toBe(USDC_ZRC20);
            expect(getZRC20Address('DAI')).toBe(DAI_ZRC20);
            expect(getZRC20Address('dai')).toBe(DAI_ZRC20);
            expect(getZRC20Address('PEPE')).toBe(PEPE_ZRC20);
            expect(getZRC20Address('pepe')).toBe(PEPE_ZRC20);
            expect(getZRC20Address('ETH')).toBe(ETH_ZRC20);
            expect(getZRC20Address('eth')).toBe(ETH_ZRC20);
        });

        it('should return "Unsupported" for unsupported tokens', () => {
            expect(getZRC20Address('UNSUPPORTED')).toBe('Unsupported');
            expect(getZRC20Address('')).toBe('Unsupported');
        });
    });

    // getZRC20ForNativeToken Tests
    describe('getZRC20ForNativeToken', () => {
        it('should return correct ZRC20 address for supported native tokens', () => {
            expect(getZRC20ForNativeToken(ChainId.ETHEREUM)).toBe(ETH_ZRC20);
            expect(getZRC20ForNativeToken(ChainId.BASE)).toBe('0x1de70f3e971b62a0707da18100392af14f7fb677');
            expect(getZRC20ForNativeToken(ChainId.POLYGON)).toBe('0xadf73eba3ebaa7254e859549a44c74ef7cff7501');
            expect(getZRC20ForNativeToken(ChainId.BSC)).toBe('0x48f80608b672dc30dc7e3dbbd0343c5f02c738eb');
            expect(getZRC20ForNativeToken(9999)).toBe('0x13a0c5930c028511dc02665e7285134b6d11a5f4');
        });

        it('should return "Unsupported" for unsupported chains', () => {
            expect(getZRC20ForNativeToken(999999)).toBe('Unsupported');
        });
    });

    // getDataForCrossChain Tests
    describe('getDataForCrossChain', () => {
        it('should generate correct cross-chain data', () => {
            const destToken = '0x1234567890123456789012345678901234567890';
            const walletAddress = '0x9876543210987654321098765432109876543210';

            const data = getDataForCrossChain(destToken, walletAddress);

            expect(data).toBe('0x' + EDDY_CROSS_CHAIN_BRIDGE.slice(2) + destToken.slice(2) + walletAddress.slice(2));
        });
    });

    // getDataForBitcoin Tests
    describe('getDataForBitcoin', () => {
        it('should generate correct Bitcoin cross-chain data', () => {
            const btcWalletAddress = 'bc1qtest1234567890';

            const data = getDataForBitcoin(btcWalletAddress);

            // Verify the data starts with the correct cross-chain bridge address
            expect(data.startsWith('0x' + EDDY_CROSS_CHAIN_BRIDGE.slice(2))).toBe(true);

            // Verify the BTC ZRC20 address is included
            expect(data.includes(BTC_ZRC20.slice(2))).toBe(true);
        });
    });

    // Supported Chains Tests
    describe('supportedChains', () => {
        it('should contain correct chain IDs', () => {
            expect(supportedChains).toEqual([
                ChainId.ETHEREUM,
                ChainId.POLYGON,
                ChainId.BASE,
                ChainId.BSC,
                9999, // BTC_CHAIN_ID
            ]);
        });
    });

    // fetchBridgeQuote Tests (existing tests)
    describe('fetchBridgeQuote', () => {
        const props = {
            srcToken: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' as Address,
            destToken: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' as Address,
            amount: '30000000000000000',
            slippage: 0.5,
        };

        it('Should handle successful quote fetch', async () => {
            const result = await fetchBridgeQuote(props.srcToken, props.destToken, props.amount, props.slippage, 1, 8453);

            expect(result).toEqual({
                estimatedRecievedAmount: '29000000000000000',
                quoteAmount: '30000000000000000',
                minimumReceived: '28000000000000000',
            });
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
    });

    // fetchPrice Tests
    describe('fetchPrice', () => {
        it('Should fetch price successfully', async () => {
            const result = await fetchPrice(BTC_ZRC20);
            console.log(result);
            expect(result).toBeGreaterThan(0);
        });

        it('Should handle HTTP errors', async () => {
            mockFetch.mockImplementationOnce(() =>
                Promise.resolve({
                    ok: false,
                    status: 500,
                } as Response),
            );

            await expect(fetchPrice(USDT_ZRC20)).rejects.toThrow('HTTP error! Status: 500');
        });

        it('Should handle invalid response data', async () => {
            mockFetch.mockImplementationOnce(() =>
                Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ data: undefined }),
                } as Response),
            );

            await expect(fetchPrice(USDC_ZRC20)).rejects.toThrow('Invalid response: {}');
        });
    });
});

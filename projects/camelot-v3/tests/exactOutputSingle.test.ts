import { exactInputSingle, exactOutputSingle } from '../functions';
import { Address, decodeFunctionData } from 'viem';
import { toResult, FunctionOptions, SendTransactionProps, TransactionReturn, ChainId } from '@heyanon/sdk';
import { TransactionParams } from '@heyanon/sdk/dist/blockchain/types';
import { swapRouterAbi } from '../abis';
import { ADDRESSES } from '../constants';

// Test data taken from: https://arbiscan.io/tx/0x481eb8d96c5c33cbc5ebf3224cff93008518cdbb88d2de2d5804e31d7de3730f
const chainId = ChainId.ARBITRUM;
const spender = '0x29BBc2B5afF41A2143f7d28fe6944453178f1473' as Address;
const pool = '0x1818FF61ba19C06A554C803eD98B603D5b7D1B43' as Address;
const tokenIn = '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1' as Address; // WETH
const tokenOut = '0xD56734d7f9979dD94FAE3d67C7e928234e71cD4C' as Address; // TIA.n
const amountIn = 107031653463694801n;
const tokenInDecimals = 18;
const tokenOutDecimals = 6;
const deadline = 1737101411;

jest.mock('@heyanon/sdk', () => ({
    ...jest.requireActual('@heyanon/sdk'),
    checkToApprove: jest.fn((props: any) => {
        if (props.args.account != spender) {
            throw new Error('Invalid account');
        }
        if (props.args.target != tokenIn) {
            throw new Error('Invalid target');
        }
        if (props.args.spender != ADDRESSES[chainId].SWAP_ROUTER_ADDRESS) {
            throw new Error('Invalid spender');
        }
        if (props.args.amount <= 0n) {
            throw new Error('Invalid amount');
        }
        return Promise.resolve();
    }),
}));

const mockNotify = jest.fn((message: string) => {
    console.log(message);
    return Promise.resolve();
});

const mockSendTransactions = jest.fn();

const mockGetProvider = jest.fn().mockReturnValue({
    readContract: jest.fn((readContractProps: any) => {
        switch (readContractProps.functionName) {
            case 'decimals':
                if (readContractProps.address == tokenIn) {
                    return Promise.resolve(tokenInDecimals);
                }
                if (readContractProps.address == tokenOut) {
                    return Promise.resolve(tokenOutDecimals);
                }
                throw new Error(`Invalid token ${readContractProps.address}`);
            case 'symbol':
                switch (readContractProps.address) {
                    case tokenIn:
                        return Promise.resolve('WETH');
                    case tokenOut:
                        return Promise.resolve('TIA.n');
                    default:
                        throw new Error(`Invalid token ${readContractProps.address}`);
                }
            case 'poolByPair': {
                return Promise.resolve(pool);
            }
            case 'token0': {
                return Promise.resolve(tokenIn);
            }
            case 'token1': {
                return Promise.resolve(tokenOut);
            }
            default:
                throw new Error(`Invalid function ${readContractProps.functionName}`);
        }
    }),
    getTransactionReceipt: jest.fn(() => {
        return Promise.resolve({
            logs: [
                {
                    address: '0x1818FF61ba19C06A554C803eD98B603D5b7D1B43',
                    topics: ['0xc42079f94a6350d7e6235f29174924f928cc2ac818eb64fed8004e115fbcca67', '0x0000000000000000000000001f721e2e82f6676fce4ea07a5958cf098d339e18', '0x00000000000000000000000029bbc2b5aff41a2143f7d28fe6944453178f1473'],
                    data: '0x000000000000000000000000000000000000000000000000017c40b8c46d1dd1fffffffffffffffffffffffffffffffffffffffffffffffffffffffffbfe9c0000000000000000000000000000000000000000000001a4e7620580d1ae306fb20000000000000000000000000000000000000000000000000012b9bac2f41b16fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffcc45e',
                    blockNumber: 0,
                    transactionHash: '0x',
                    transactionIndex: 0,
                    blockHash: '0x',
                    logIndex: 0,
                    removed: false,
                },
            ],
        });
    }),
});

describe('exactOutputSingle', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        jest.spyOn(Date, 'now').mockImplementation(() => (deadline - 5 * 60) * 1000);
    });

    const props = {
        chainName: 'arbitrum-one',
        account: spender,
        tokenIn: tokenIn,
        tokenOut: '0xD56734d7f9979dD94FAE3d67C7e928234e71cD4C' as Address, // TIA
        amountOut: '67.200000',
        amountInMax: '0.10715526778495682',
        recipient: spender,
        slippage: 250,
    };

    const functionOptions: FunctionOptions = {
        sendTransactions: mockSendTransactions,
        notify: mockNotify,
        getProvider: mockGetProvider,
    };

    it('should prepare and send transactions correctly', async () => {
        // Mock time, to match a TX deadline (position 5 minutes before the deadline)
        jest.spyOn(Date, 'now').mockImplementation(() => (deadline - 5 * 60) * 1000);

        // Capture transactions to verify correct call data
        let capturedTransactions: TransactionParams[] = [];
        const mockSendTransactions = jest.fn((props: SendTransactionProps): Promise<TransactionReturn> => {
            capturedTransactions = props.transactions;

            return Promise.resolve({
                isMultisig: false,
                data: [{ message: 'Transaction successful', hash: '0x' }],
            });
        });

        const result = await exactOutputSingle(props, {
            ...functionOptions,
            sendTransactions: mockSendTransactions,
            getProvider: mockGetProvider,
        });

        // Check return values
        expect(result.success).toEqual(true);
        expect(result.data).toContain('success');

        // Check transaction data
        expect(capturedTransactions).toHaveLength(1);
        expect(capturedTransactions[0].target).toEqual(ADDRESSES[chainId].SWAP_ROUTER_ADDRESS);
        expect(capturedTransactions[0].data).toEqual(
            '0xdb3e219800000000000000000000000082af49447d8a07e3bd95bd0d56f35241523fbab1000000000000000000000000d56734d7f9979dd94fae3d67c7e928234e71cd4c000000000000000000000000000000000000000000000000000000000000000000000000000000000000000029bbc2b5aff41a2143f7d28fe6944453178f147300000000000000000000000000000000000000000000000000000000678a1063000000000000000000000000000000000000000000000000000000000401640000000000000000000000000000000000000000000000000001863593b7f004440000000000000000000000000000000000000000000000000000000000000000',
        );
    });

    it('should return an error if the amountOut is 0', async () => {
        const result = await exactOutputSingle({ ...props, amountOut: '0' }, functionOptions);
        expect(result).toEqual(toResult('Amount OUT must be greater than 0', true));
    });

    it('should return an error if the amountInMax is 0', async () => {
        const result = await exactOutputSingle({ ...props, amountInMax: '0' }, functionOptions);
        expect(result).toEqual(toResult('Amount IN MAX must be greater than 0', true));
    });

    it('should return an error if decimals() fails', async () => {
        const mockGetProvider = jest.fn().mockReturnValue({
            readContract: jest.fn((readContractProps: any) => {
                switch (readContractProps.functionName) {
                    case 'decimals':
                        throw new Error(`Invalid token ${readContractProps.address}`);
                    default:
                        throw new Error(`Invalid function ${readContractProps.functionName}`);
                }
            }),
        });

        const result = await exactOutputSingle({ ...props, amountOut: '0' }, {
            ...functionOptions,
            getProvider: mockGetProvider,
        });
        expect(result).toEqual(toResult(`Invalid ERC20 token contract at address ${props.tokenOut}. Failed to fetch token details`, true));
    });

    it('should automatically adjust the slippage', async () => {
        // Mock quote
        const amountIn = 107031653463694801n;
        const newMockGetProvider = jest.fn().mockReturnValue({
            readContract: jest.fn((readContractProps: any) => {
                switch (readContractProps.functionName) {
                    case 'decimals':
                        if (readContractProps.address == tokenIn) {
                            return Promise.resolve(tokenInDecimals);
                        }
                        if (readContractProps.address == tokenOut) {
                            return Promise.resolve(tokenOutDecimals);
                        }
                        throw new Error(`Invalid token ${readContractProps.address}`);
                    case 'symbol':
                        switch (readContractProps.address) {
                            case tokenIn:
                                return Promise.resolve('WETH');
                            case tokenOut:
                                return Promise.resolve('TIA.n');
                            default:
                                throw new Error(`Invalid token ${readContractProps.address}`);
                        }
                    case 'poolByPair': {
                        return Promise.resolve(pool);
                    }
                    case 'token0': {
                        return Promise.resolve(tokenIn);
                    }
                    case 'token1': {
                        return Promise.resolve(tokenOut);
                    }
                    default:
                        throw new Error(`Invalid function ${readContractProps.functionName}`);
                }
            }),
            getTransactionReceipt: jest.fn(() => {
                return Promise.resolve({
                    logs: [
                        {
                            address: '0x1818FF61ba19C06A554C803eD98B603D5b7D1B43',
                            topics: ['0xc42079f94a6350d7e6235f29174924f928cc2ac818eb64fed8004e115fbcca67', '0x0000000000000000000000001f721e2e82f6676fce4ea07a5958cf098d339e18', '0x00000000000000000000000029bbc2b5aff41a2143f7d28fe6944453178f1473'],
                            data: '0x000000000000000000000000000000000000000000000000017c40b8c46d1dd1fffffffffffffffffffffffffffffffffffffffffffffffffffffffffbfe9c0000000000000000000000000000000000000000000001a4e7620580d1ae306fb20000000000000000000000000000000000000000000000000012b9bac2f41b16fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffcc45e',
                            blockNumber: 0,
                            transactionHash: '0x',
                            transactionIndex: 0,
                            blockHash: '0x',
                            logIndex: 0,
                            removed: false,
                        },
                    ],
                });
            }),
            simulateContract: jest.fn((simulateContractProps: any) => {
                switch (simulateContractProps.functionName) {
                    case 'quoteExactOutputSingle':
                        return Promise.resolve({
                            result: [amountIn, 4515n],
                        });
                    default:
                        throw new Error(`Invalid function ${simulateContractProps.functionName}`);
                }
            }),
        });

        // Capture transactions to verify correct call data
        let capturedTransactions: TransactionParams[] = [];
        const mockSendTransactions = jest.fn((props: SendTransactionProps): Promise<TransactionReturn> => {
            capturedTransactions = props.transactions;

            return Promise.resolve({
                isMultisig: false,
                data: [{ message: 'Transaction successful', hash: '0x' }],
            });
        });

        const result = await exactOutputSingle(
            { ...props, amountInMax: undefined, slippage: undefined },
            {
                ...functionOptions,
                sendTransactions: mockSendTransactions,
                getProvider: newMockGetProvider,
            },
        );

        // Check return values
        expect(result.success).toEqual(true);
        expect(result.data).toContain('success');

        // Check transaction data
        expect(capturedTransactions).toHaveLength(1);
        expect(capturedTransactions[0].target).toEqual(ADDRESSES[chainId].SWAP_ROUTER_ADDRESS);

        const decoded = decodeFunctionData({
            abi: swapRouterAbi,
            data: capturedTransactions[0].data,
        });
        const expectedAmountInMax = amountIn + (amountIn * 2n) / 10000n;
        const actualAmountInMax = (decoded.args[0] as any).amountInMaximum;

        // Evaluate diff, because the 2 different equations can result in slightly different values due to rounding (max 1 wei diff)
        const diff = expectedAmountInMax - actualAmountInMax;
        expect(diff).toBeGreaterThanOrEqual(-1n);
        expect(diff).toBeLessThanOrEqual(1n);
    });

    it('should return an error if slippage is decimal', async () => {
        let slippage = 10.01;
        const result = await exactOutputSingle({ ...props, slippage: slippage }, functionOptions);
        expect(result).toEqual(toResult('Invalid slippage tolerance: 10.01, please provide a whole non-negative number, max 3% got 0.1001 %', true));
    });

    it('should return an error if slippage is negative', async () => {
        let slippage = -10;
        const result = await exactOutputSingle({ ...props, slippage: slippage }, functionOptions);
        expect(result).toEqual(toResult('Invalid slippage tolerance: -10, please provide a whole non-negative number, max 3% got -0.1 %', true));
    });

    it('should return an error if slippage is decimal', async () => {
        let slippage = 10.01;
        const result = await exactOutputSingle({ ...props, slippage: slippage }, functionOptions);
        expect(result).toEqual(toResult('Invalid slippage tolerance: 10.01, please provide a whole non-negative number, max 3% got 0.1001 %', true));
    });

    it('should return an error if slippage is above threshold', async () => {
        let slippage = 500;
        const result = await exactOutputSingle({ ...props, slippage: slippage }, functionOptions);
        expect(result).toEqual(toResult('Invalid slippage tolerance: 500, please provide a whole non-negative number, max 3% got 5 %', true));
    });

    it('should set the recipient correctly', async () => {
        // Capture transactions to verify correct call data
        let capturedTransactions: TransactionParams[] = [];
        const mockSendTransactions = jest.fn((props: SendTransactionProps): Promise<TransactionReturn> => {
            capturedTransactions = props.transactions;

            return Promise.resolve({
                isMultisig: false,
                data: [{ message: 'Transaction successful', hash: '0x' }],
            });
        });

        const newRecipient = '0x000000000000000000000000000000000000dEaD' as Address;
        const result = await exactOutputSingle(
            { ...props, recipient: newRecipient },
            {
                ...functionOptions,
                sendTransactions: mockSendTransactions,
                getProvider: mockGetProvider,
            },
        );

        // Check return values
        expect(result.success).toEqual(true);
        expect(result.data).toContain('success');

        // Check transaction data
        expect(capturedTransactions).toHaveLength(1);
        expect(capturedTransactions[0].target).toEqual(ADDRESSES[chainId].SWAP_ROUTER_ADDRESS);

        const decoded = decodeFunctionData({
            abi: swapRouterAbi,
            data: capturedTransactions[0].data,
        });
        expect((decoded.args[0] as any).recipient).toEqual(newRecipient);
    });
});

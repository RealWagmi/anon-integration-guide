import { exactInputSingle } from '../functions';
import { Address, decodeFunctionData } from 'viem';
import { toResult, FunctionOptions, SendTransactionProps, TransactionReturn, ChainId } from '@heyanon/sdk';
import { TransactionParams } from '@heyanon/sdk/dist/blockchain/types';
import { swapRouterAbi } from '../abis';
import { ADDRESSES } from '../constants';

// Test data taken from: https://arbiscan.io/tx/0xe24017219919a7c224c2d86cf66b78943f6893e5bd6253ee757b42b71158acca
const chainId = ChainId.ARBITRUM;
const spender = '0x33128fA08f5E0545f4714434b53bDb5E98F62474' as Address;
const tokenIn = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' as Address; // USDC
const tokenOut = '0x2bcC6D6CdBbDC0a4071e48bb3B969b06B3330c07'; // WSOL
const tokenInDecimals = 6;
const tokenOutDecimals = 9;
const deadline = 1737057612;

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
                switch (readContractProps.address) {
                    case tokenIn:
                        return Promise.resolve(tokenInDecimals);
                    case tokenOut:
                        return Promise.resolve(tokenOutDecimals);
                    default:
                        throw new Error(`Invalid token ${readContractProps.address}`);
                }
                break;
            default:
                throw new Error(`Invalid function ${readContractProps.functionName}`);
        }
    }),
});

describe('exactInputSingle', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        jest.spyOn(Date, 'now').mockImplementation(() => (deadline - 5 * 60) * 1000);
    });

    const props = {
        chainName: 'arbitrum-one',
        account: spender,
        tokenIn: tokenIn,
        tokenOut: '0x2bcC6D6CdBbDC0a4071e48bb3B969b06B3330c07' as Address, // WSOL
        amountIn: '600',
        amountOutMin: '2.806134849',
        recipient: spender,
    };

    const functionOptions: FunctionOptions = {
        sendTransactions: mockSendTransactions,
        notify: mockNotify,
        getProvider: mockGetProvider,
    };

    it('should prepare and send transactions correctly', async () => {
        // Capture transactions to verify correct call data
        let capturedTransactions: TransactionParams[] = [];
        const mockSendTransactions = jest.fn((props: SendTransactionProps): Promise<TransactionReturn> => {
            capturedTransactions = props.transactions;

            return Promise.resolve({
                isMultisig: false,
                data: [{ message: 'Transaction successful', hash: '0x' }],
            });
        });

        const result = await exactInputSingle(props, {
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
            '0xbc651188000000000000000000000000af88d065e77c8cc2239327c5edb3a432268e58310000000000000000000000002bcc6d6cdbbdc0a4071e48bb3b969b06b3330c0700000000000000000000000033128fa08f5e0545f4714434b53bdb5e98f62474000000000000000000000000000000000000000000000000000000006789654c0000000000000000000000000000000000000000000000000000000023c3460000000000000000000000000000000000000000000000000000000000a74238410000000000000000000000000000000000000000000000000000000000000000',
        );
    });

    it('should return an error if the amountIn is 0', async () => {
        const result = await exactInputSingle({ ...props, amountIn: '0' }, functionOptions);
        expect(result).toEqual(toResult('Amount IN must be greater than 0', true));
    });

    it('should return an error if the amountOutMin is 0', async () => {
        const result = await exactInputSingle({ ...props, amountOutMin: '0' }, functionOptions);
        expect(result).toEqual(toResult('Amount OUT MIN must be greater than 0', true));
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

        const result = await exactInputSingle({ ...props, amountIn: '0' }, { ...functionOptions, getProvider: mockGetProvider });
        expect(result).toEqual(toResult(`Failed to get decimals for token ${props.tokenIn}`, true));
    });

    it('should automatically adjust the slippage', async () => {
        // Mock quote
        const amountOut = 2806732770n;
        const newMockGetProvider = jest.fn().mockReturnValue({
            readContract: jest.fn((readContractProps: any) => {
                switch (readContractProps.functionName) {
                    case 'decimals':
                        if (readContractProps.address == props.tokenIn) {
                            return Promise.resolve(tokenInDecimals);
                        }
                        if (readContractProps.address == props.tokenOut) {
                            return Promise.resolve(tokenOutDecimals);
                        }
                        throw new Error(`Invalid token ${readContractProps.address}`);
                    default:
                        throw new Error(`Invalid function ${readContractProps.functionName}`);
                }
            }),
            simulateContract: jest.fn((simulateContractProps: any) => {
                switch (simulateContractProps.functionName) {
                    case 'quoteExactInputSingle':
                        return Promise.resolve({
                            result: [amountOut, 4515n],
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

        const result = await exactInputSingle(
            { ...props, amountOutMin: undefined },
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
        const expectedAmountOutMin = amountOut - (amountOut * 2n) / 10000n;
        const actualAmountOutMin = (decoded.args[0] as any).amountOutMinimum;

        // Evaluate diff, because the 2 different equations can result in slightly different values due to rounding (max 1 wei diff)
        const diff = expectedAmountOutMin - actualAmountOutMin;
        expect(diff).toBeGreaterThanOrEqual(-1n);
        expect(diff).toBeLessThanOrEqual(1n);
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
        const result = await exactInputSingle(
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

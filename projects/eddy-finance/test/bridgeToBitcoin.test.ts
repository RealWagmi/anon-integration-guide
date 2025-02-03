import { bridgeToBitcoin } from '../functions/bridgeToBitcoin';
import { Address } from 'viem';
import { toResult, TransactionReturn, ChainId } from '@heyanon/sdk';
import { TransactionParams } from '@heyanon/sdk/dist/blockchain/types';
import { getNativeTokenName } from '../constants';
import { getBalance } from 'viem/_types/actions/public/getBalance';

const account = '0xF493118C11E32c6622933010775119622190BF2D' as Address;
const btcWallet = 'bc1qzvyawuse72fwwksy04luc0yqrd2n2er3h6jz0e' as string;

describe('bridgeToBitcoin', () => {
    const mockNotify = jest.fn((message: string) => {
        console.log(message);
        return Promise.resolve();
    });

    const mockProvider = jest.fn().mockReturnValue({
        readContract: jest.fn(),
        simulateContract: jest.fn(),
        getBalance: jest.fn().mockReturnValue(1000000000000000000n),
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    const props = {
        chainName: 'ethereum',
        account: account,
        amount: '0.05',
        btcWallet: btcWallet,
    };

    it('Should prepare and send bridge transaction correctly', async () => {
        let capturedTransactions: TransactionParams[] = [];

        const mockSendTransactions = jest.fn((props: any): Promise<TransactionReturn> => {
            capturedTransactions = props.transactions;
            return Promise.resolve({
                isMultisig: false,
                data: [{ message: 'Transaction successful', hash: '0x' }],
            });
        });

        const result = await bridgeToBitcoin(props, {
            sendTransactions: mockSendTransactions,
            notify: mockNotify,
            getProvider: mockProvider,
        });

        const nativeTokenName = getNativeTokenName(ChainId.ETHEREUM);

        expect(result.success).toEqual(true);
        expect(result.data).toContain(`Successfully bridged ${props.amount} ${nativeTokenName} to Bitcoin`);
        expect(mockNotify).toHaveBeenCalledWith('Preparing to bridge to Bitcoin 🚀');
        expect(mockNotify).toHaveBeenCalledWith('Waiting for transaction confirmation ⏳ ...');
    });

    it('should handle multisig transactions', async () => {
        const mockSendTransactions = jest.fn((): Promise<TransactionReturn> => {
            return Promise.resolve({
                isMultisig: true,
                data: [{ message: 'Multisig transaction created', hash: '0x' }],
            });
        });

        const result = await bridgeToBitcoin(props, {
            sendTransactions: mockSendTransactions,
            notify: mockNotify,
            getProvider: mockProvider,
        });

        expect(result.success).toEqual(true);
        expect(result.data).toContain('Multisig transaction created');
    });

    it('should return error if wallet is not connected', async () => {
        const result = await bridgeToBitcoin(
            { ...props, account: '' as Address },
            {
                notify: mockNotify,
                sendTransactions: jest.fn(),
                getProvider: mockProvider,
            },
        );

        expect(result).toEqual(toResult('Wallet not connected', true));
    });

    it('should return error if btc wallet is not provided', async () => {
        const result = await bridgeToBitcoin(
            { ...props, btcWallet: '' as string },
            {
                notify: mockNotify,
                sendTransactions: jest.fn(),
                getProvider: mockProvider,
            },
        );

        expect(result).toEqual(toResult('Bitcoin wallet address is required', true));
    });

    it('should return error for zero amount', async () => {
        const result = await bridgeToBitcoin(
            { ...props, amount: '0' },
            {
                notify: mockNotify,
                sendTransactions: jest.fn(),
                getProvider: mockProvider,
            },
        );

        expect(result).toEqual(toResult('Amount must be greater than 0', true));
    });

    it('should return error for unsupported chain name', async () => {
        const result = await bridgeToBitcoin(
            { ...props, chainName: 'kava' },
            {
                notify: mockNotify,
                sendTransactions: jest.fn(),
                getProvider: mockProvider,
            },
        );

        expect(result).toEqual(toResult('Eddy Finance is not supported on kava', true));
    });

    it('should return error for unsupported chain name', async () => {
        const result = await bridgeToBitcoin(
            { ...props, chainName: 'kava' },
            {
                notify: mockNotify,
                sendTransactions: jest.fn(),
                getProvider: mockProvider,
            },
        );

        expect(result).toEqual(toResult('Eddy Finance is not supported on kava', true));
    });

    it('should handle transaction errors', async () => {
        const mockSendTransactions = jest.fn(() => {
            throw new Error('Transaction failed');
        });

        const result = await bridgeToBitcoin(props, {
            notify: mockNotify,
            sendTransactions: mockSendTransactions,
            getProvider: mockProvider,
        });

        expect(result).toEqual(toResult('Failed to bridge funds to Bitcoin. Please try again.', true));
    });

    it('should handle balance check errors', async () => {
        const mockProvider = jest.fn().mockReturnValue({
            readContract: jest.fn(),
            simulateContract: jest.fn(),
            getBalance: jest.fn().mockReturnValue(0n),
        });

        const result = await bridgeToBitcoin(props, {
            notify: mockNotify,
            sendTransactions: jest.fn(),
            getProvider: mockProvider,
        });

        expect(mockNotify).toHaveBeenCalledWith('Checking user balance ⏳ ...');
        expect(result).toEqual(toResult('Insufficient balance.Required: 0.05 but got: 0', true));
    });

    it('should return ETH for Ethereum chain', () => {
        const result = getNativeTokenName(ChainId.ETHEREUM);
        expect(result).toBe('ETH');
    });

    it('should return BNB for BSC chain', () => {
        const result = getNativeTokenName(ChainId.BSC);
        expect(result).toBe('BNB');
    });

    it('should return POL for Polygon chain', () => {
        const result = getNativeTokenName(ChainId.POLYGON);
        expect(result).toBe('POL');
    });

    it('should return ETH for Base chain', () => {
        const result = getNativeTokenName(ChainId.BASE);
        expect(result).toBe('ETH');
    });

    it('should return "Not supported" for unsupported chains', () => {
        // Test with an arbitrary chain ID that's not in the switch statement
        const result = getNativeTokenName(999999);
        expect(result).toBe('Not supported');
    });

    it('should return "Not supported" for invalid chain IDs', () => {
        // Test with negative numbers
        expect(getNativeTokenName(-1)).toBe('Not supported');

        // Test with zero
        expect(getNativeTokenName(0)).toBe('Not supported');
    });
});

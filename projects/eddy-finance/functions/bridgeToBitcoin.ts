import { Address, parseUnits } from 'viem';
import { FunctionReturn, FunctionOptions, TransactionParams, toResult, getChainFromName } from '@heyanon/sdk';
import { getDataForBitcoin, supportedChains, TSS_ADDRESS, getNativeTokenName } from '../constants';

interface Props {
    chainName: string;
    account: Address;
    btcWallet: string;
    amount: string;
}

/**
 * Bridge native token to BTC on Bitcoin.
 * @param chainName - Source chain
 * @param account - User account address
 * @param btcWallet - Bitcoin wallet address to receive funds
 * @param amount - Amount to bridge
 * @returns Transaction result
 */
export async function bridgeToBitcoin({ chainName, account, btcWallet, amount }: Props, { sendTransactions, notify }: FunctionOptions): Promise<FunctionReturn> {
    try {
        // Check wallet connection
        if (!account) return toResult('Wallet not connected', true);

        // Validate chain
        const chainId = getChainFromName(chainName);
        if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
        if (!supportedChains.includes(chainId)) return toResult(`Eddy Finance is not supported on ${chainName}`, true);

        // Validate amount
        const amountInWei = parseUnits(amount, 18);
        if (amountInWei === 0n) return toResult('Amount must be greater than 0', true);

        await notify('Preparing to bridge to Bitcoin 🚀');

        const transactions: TransactionParams[] = [];

        // Validate Bitcoin wallet
        if (!btcWallet) {
            return toResult('Bitcoin wallet address is required', true);
        }

        // Get data for bridge
        const data: `0x${string}` = getDataForBitcoin(btcWallet) as `0x${string}`;
        console.log('data:', data);

        // TSS_ADDRESS info : https://www.zetachain.com/docs/reference/network/contracts/
        // TSS is a special address that triggers crosschain transactions
        const tx: TransactionParams = {
            target: TSS_ADDRESS, //Send funds to TSS_ADDRESS which triggers crosschain transaction
            data: data, // No encoded function as it is a simple transfer to EOA
            value: amountInWei,
        };

        transactions.push(tx);

        await notify('Waiting for transaction confirmation ⏳ ...');

        const result = await sendTransactions({ chainId, account, transactions });

        const message = result.data[result.data.length - 1];

        const nativeTokenName = getNativeTokenName(chainId);

        return toResult(result.isMultisig ? message.message : `Successfully bridged ${amount} ${nativeTokenName} to Bitcoin. ${message.message}`);
    } catch (error) {
        console.error('Bridge error:', error);
        return toResult('Failed to bridge funds to Bitcoin. Please try again.', true);
    }
}

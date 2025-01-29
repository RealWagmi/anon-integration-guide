import { Address, parseUnits } from 'viem';
import { FunctionReturn, FunctionOptions, TransactionParams, toResult, getChainFromName, checkToApprove } from '@heyanon/sdk';
import { getDataForCrossChain, supportedChains, TSS_ADDRESS, getNativeTokenName } from '../constants';

interface Props {
    chainName: string;
    destToken: Address;
    account: Address;
    amount: string;
}

/**
 * Bridge native token to any destination token on Ethereum.
 * @param chainName - Source chain
 * @param destToken - zrc20 token address of desired token on destination chain
 * @param account - User account address
 * @param amount - Amount to bridge
 * @returns Transaction result
 */
export async function bridgeToEthereum({ chainName, account, destToken, amount }: Props, { sendTransactions, notify }: FunctionOptions): Promise<FunctionReturn> {
    try {
        // Check wallet connection
        if (!account) return toResult('Wallet not connected', true);

        // Validate chain
        const chainId = getChainFromName(chainName);
        if (chainId === undefined) return toResult(`Unsupported chain name: ${chainName}`, true);
        if (!supportedChains.includes(chainId)) return toResult(`Eddy Finance is not supported on ${chainName}`, true);

        // Validate amount
        const amountInWei = parseUnits(amount, 18);
        if (amountInWei === 0n) return toResult('Amount must be greater than 0', true);

        await notify('Preparing to bridge to Ethereum 🚀');

        const transactions: TransactionParams[] = [];

        if (!destToken) {
            return toResult('Destination token address is required', true);
        }

        // Get data for bridge
        const data: `0x${string}` = getDataForCrossChain(destToken, account) as `0x${string}`;

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

        return toResult(result.isMultisig ? message.message : `Successfully bridged ${amount} ${nativeTokenName} to Ethereum. ${message.message}`);
    } catch (error) {
        console.error('Bridge error:', error);
        return toResult('Failed to bridge funds to Ethereum. Please try again.', true);
    }
}

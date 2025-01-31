import { Address, encodeFunctionData } from 'viem';
import { FunctionReturn, FunctionOptions, TransactionParams, toResult, getChainFromName } from '@heyanon/sdk';
import { supportedChains } from '../../constants';
import { veNftAbi } from '../../abis/veNftAbi';

interface Props {
    chainName: string;
    account: Address;
    vestedAddress: Address;
    fromTokenId: string;
    toTokenId: string;
}

/**
 * Merges two vested NFT positions
 * @param props - The merge parameters
 * @param options - System tools for blockchain interactions
 * @returns Transaction result
 */
export async function merge({ chainName, account, vestedAddress, fromTokenId, toTokenId }: Props, { sendTransactions, notify }: FunctionOptions): Promise<FunctionReturn> {
    // Check wallet connection
    if (!account) return toResult('Wallet not connected', true);

    // Validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Equalizer is not supported on ${chainName}`, true);

    // Validate addresses and token IDs
    if (!vestedAddress) return toResult('Vested token address is required', true);
    if (fromTokenId === toTokenId) return toResult('Source and destination token IDs must be different', true);

    const fromTokenIdBn = BigInt(fromTokenId);
    const toTokenIdBn = BigInt(toTokenId);

    await notify('Preparing to merge vested positions...');

    const transactions: TransactionParams[] = [];

    const mergeTx: TransactionParams = {
        target: vestedAddress,
        data: encodeFunctionData({
            abi: veNftAbi,
            functionName: 'merge',
            args: [fromTokenIdBn, toTokenIdBn],
        }),
    };
    transactions.push(mergeTx);

    await notify('Waiting for transaction confirmation...');

    const result = await sendTransactions({ chainId, account, transactions });
    const mergeMessage = result.data[result.data.length - 1];

    return toResult(result.isMultisig ? mergeMessage.message : `Successfully merged vested positions. ${mergeMessage.message}`);
}

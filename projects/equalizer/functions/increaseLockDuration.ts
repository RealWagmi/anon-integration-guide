import { Address, encodeFunctionData } from 'viem';
import { FunctionReturn, FunctionOptions, TransactionParams, toResult, getChainFromName } from '@heyanon/sdk';
import { supportedChains, VE_EQUAL_ADDRESS } from '../constants';
import { veNftAbi } from '../abis/veNftAbi';

interface Props {
    chainName: string;
    account: Address;
    tokenId: string;
    secondsToExtend: string;
}

/**
 * Increases the lock duration for a vested token position
 * @param props - The lock duration increase parameters
 * @param options - System tools for blockchain interactions
 * @returns Transaction result
 */
export async function increaseLockDuration({ chainName, account, tokenId, secondsToExtend }: Props, { sendTransactions, notify }: FunctionOptions): Promise<FunctionReturn> {
    // Check wallet connection
    if (!account) return toResult('Wallet not connected', true);

    // Validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Equalizer is not supported on ${chainName}`, true);

    const tokenIdBn = BigInt(tokenId);
    const secondsToExtendBn = BigInt(secondsToExtend);

    if (secondsToExtendBn <= 0n) return toResult('Extension duration must be greater than 0', true);

    await notify('Preparing to increase lock duration...');

    const transactions: TransactionParams[] = [];

    const increaseTx: TransactionParams = {
        target: VE_EQUAL_ADDRESS,
        data: encodeFunctionData({
            abi: veNftAbi,
            functionName: 'increase_unlock_time',
            args: [tokenIdBn, secondsToExtendBn],
        }),
    };
    transactions.push(increaseTx);

    await notify('Waiting for transaction confirmation...');

    const result = await sendTransactions({ chainId, account, transactions });
    const increaseMessage = result.data[result.data.length - 1];

    return toResult(result.isMultisig ? increaseMessage.message : `Successfully increased lock duration. ${increaseMessage.message}`);
}

import { Address, encodeFunctionData, formatUnits, parseUnits } from 'viem';
import { FunctionReturn, FunctionOptions, TransactionParams, toResult, getChainFromName } from '@heyanon/sdk';
import { supportedChains, VE_EQUAL_ADDRESS } from '../constants';
import { veNftAbi } from '../abis/veNftAbi';

interface Props {
    chainName: string;
    account: Address;
    tokenId: string;
    amount: string;
}

/**
 * Increases the lock amount for a vested token position
 * @param props - The lock increase parameters
 * @param options - System tools for blockchain interactions
 * @returns Transaction result
 */
export async function increaseLockAmount({ chainName, account, tokenId, amount }: Props, { sendTransactions, notify }: FunctionOptions): Promise<FunctionReturn> {
    // Check wallet connection
    if (!account) return toResult('Wallet not connected', true);

    // Validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Equalizer is not supported on ${chainName}`, true);

    const tokenIdBn = BigInt(tokenId);
    // we can assume the decimals are 18 since the token is static
    const amountBn = parseUnits(amount, 18);

    if (amountBn <= 0n) return toResult('Amount must be greater than 0', true);

    await notify('Preparing to increase lock amount...');

    const transactions: TransactionParams[] = [];

    const increaseTx: TransactionParams = {
        target: VE_EQUAL_ADDRESS,
        data: encodeFunctionData({
            abi: veNftAbi,
            functionName: 'increase_amount',
            args: [tokenIdBn, amountBn],
        }),
    };
    transactions.push(increaseTx);

    await notify('Waiting for transaction confirmation...');

    const result = await sendTransactions({ chainId, account, transactions });
    const increaseMessage = result.data[result.data.length - 1];

    return toResult(result.isMultisig ? increaseMessage.message : `Successfully increased lock amount. ${increaseMessage.message}`);
}

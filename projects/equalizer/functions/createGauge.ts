import { Address, encodeFunctionData } from 'viem';
import { FunctionReturn, FunctionOptions, TransactionParams, toResult, getChainFromName } from '@heyanon/sdk';
import { supportedChains, VOTER_ADDRESS } from '../constants';
import { voterAbi } from '../abis';

interface Props {
    chainName: string;
    account: Address;
    pairAddress: Address;
}

/**
 * Creates a gauge for an Equalizer LP pair.
 * @param props - The gauge creation parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Transaction result.
 */
export async function createGauge({ chainName, account, pairAddress }: Props, { sendTransactions, notify, getProvider }: FunctionOptions): Promise<FunctionReturn> {
    if (!account) return toResult('Wallet not connected', true);

    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Equalizer is not supported on ${chainName}`, true);

    await notify('Preparing to create gauge...');

    const createTx: TransactionParams = {
        target: VOTER_ADDRESS,
        data: encodeFunctionData({
            abi: voterAbi,
            functionName: 'createGauge',
            args: [pairAddress],
        }),
    };

    await notify('Waiting for transaction confirmation...');

    const result = await sendTransactions({ chainId, account, transactions: [createTx] });
    const createMessage = result.data[result.data.length - 1];

    return toResult(result.isMultisig ? createMessage.message : `Successfully created gauge for pair. ${createMessage.message}`);
}

import { Address, encodeFunctionData } from 'viem';
import { FunctionReturn, FunctionOptions, TransactionParams, toResult, getChainFromName } from '@heyanon/sdk';
import { supportedChains } from '../constants';
import { pairAbi } from '../abis';

interface Props {
    chainName: string;
    account: Address;
    pairAddress: Address;
}

/**
 * Claims accumulated fees from an Equalizer LP position.
 * @param props - The claim parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Transaction result.
 */
export async function claimLpFees({ chainName, account, pairAddress }: Props, { sendTransactions, notify, getProvider }: FunctionOptions): Promise<FunctionReturn> {
    if (!account) return toResult('Wallet not connected', true);

    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Equalizer is not supported on ${chainName}`, true);

    await notify('Preparing to claim LP fees...');

    const claimTx: TransactionParams = {
        target: pairAddress,
        data: encodeFunctionData({
            abi: pairAbi,
            functionName: 'claimFees',
            args: [],
        }),
    };

    await notify('Waiting for transaction confirmation...');

    const result = await sendTransactions({ chainId, account, transactions: [claimTx] });
    const claimMessage = result.data[result.data.length - 1];

    return toResult(result.isMultisig ? claimMessage.message : `Successfully claimed LP fees. ${claimMessage.message}`);
}

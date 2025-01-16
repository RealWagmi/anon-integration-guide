import { Address, encodeFunctionData } from 'viem';
import { FunctionReturn, FunctionOptions, TransactionParams, toResult, getChainFromName } from '@heyanon/sdk';
import { supportedChains } from '../constants';
import { gaugeAbi } from '../abis';

interface Props {
    chainName: string;
    account: Address;
    gaugeAddress: Address;
    tokenAddress: Address;
}

/**
 * Claims rewards from an Equalizer gauge LP position.
 * @param props - The claim parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Transaction result.
 */
export async function claimLpRewards(
    { chainName, account, gaugeAddress, tokenAddress }: Props,
    { sendTransactions, notify, getProvider }: FunctionOptions
): Promise<FunctionReturn> {
    if (!account) return toResult('Wallet not connected', true);

    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Equalizer is not supported on ${chainName}`, true);

    await notify('Preparing to claim LP rewards...');

    const claimTx: TransactionParams = {
        target: gaugeAddress,
        data: encodeFunctionData({
            abi: gaugeAbi,
            functionName: 'getReward',
            args: [account, [tokenAddress]],
        }),
    };

    await notify('Waiting for transaction confirmation...');

    const result = await sendTransactions({ chainId, account, transactions: [claimTx] });
    const claimMessage = result.data[result.data.length - 1];

    return toResult(result.isMultisig ? claimMessage.message : `Successfully claimed LP rewards. ${claimMessage.message}`);
}

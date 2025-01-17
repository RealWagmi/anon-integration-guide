import { Address, encodeFunctionData } from 'viem';
import { FunctionReturn, FunctionOptions, TransactionParams, toResult, getChainFromName } from '@heyanon/sdk';
import { supportedChains, VOTER_ADDRESS } from '../constants';
import { voterAbi } from '../abis';

interface Props {
    chainName: string;
    account: Address;
    farmAddress: Address;
    earnedAddress: Address;
}

/**
 * Claims rewards from Equalizer CL farm position.
 * @param props - The claim parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Transaction result.
 */
export async function claimFarmReward(
    { chainName, account, farmAddress, earnedAddress }: Props,
    { sendTransactions, notify, getProvider }: FunctionOptions
): Promise<FunctionReturn> {
    if (!account) return toResult('Wallet not connected', true);

    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Equalizer is not supported on ${chainName}`, true);

    await notify('Preparing to claim farm rewards...');

    const claimTx: TransactionParams = {
        target: VOTER_ADDRESS,
        data: encodeFunctionData({
            abi: voterAbi,
            functionName: 'claimRewards',
            args: [[farmAddress], [[earnedAddress]]],
        }),
    };

    await notify('Waiting for transaction confirmation...');

    const result = await sendTransactions({ chainId, account, transactions: [claimTx] });
    const claimMessage = result.data[result.data.length - 1];

    return toResult(result.isMultisig ? claimMessage.message : `Successfully claimed farm rewards. ${claimMessage.message}`);
}

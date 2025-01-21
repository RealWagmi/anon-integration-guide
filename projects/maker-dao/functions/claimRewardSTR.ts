import { Address, encodeFunctionData } from 'viem';
import { FunctionReturn, FunctionOptions, TransactionParams, toResult, getChainFromName } from '@heyanon/sdk';
import { supportedChains, STR_ADDRESS } from '../constants';
import { strAbi } from '../abis';

interface Props {
    chainName: string;
    account: Address;
}

export async function claimRewardSTR({ chainName, account }: Props, { sendTransactions, notify, getProvider }: FunctionOptions): Promise<FunctionReturn> {
    if (!account) return toResult('Wallet not connected', true);

    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Sky protocol is not supported on ${chainName}`, true);

    await notify('Checking pending rewards...');

    // Check pending rewards
    const publicClient = getProvider(chainId);
    const pendingReward = await publicClient.readContract({
        address: STR_ADDRESS,
        abi: strAbi,
        functionName: 'earned',
        args: [account],
    });

    if (pendingReward === 0n) {
        return toResult('No rewards to claim', true);
    }

    await notify('Preparing claim transaction...');

    const tx: TransactionParams = {
        target: STR_ADDRESS,
        data: encodeFunctionData({
            abi: strAbi,
            functionName: 'getReward',
            args: [],
        }),
    };

    await notify('Waiting for transaction confirmation...');

    const result = await sendTransactions({ chainId, account, transactions: [tx] });
    const claimMessage = result.data[result.data.length - 1];

    return toResult(result.isMultisig ? claimMessage.message : `Successfully claimed SKY rewards. ${claimMessage.message}`);
}

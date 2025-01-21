import { Address, formatUnits } from 'viem';
import { FunctionReturn, toResult, getChainFromName, FunctionOptions } from '@heyanon/sdk';
import { supportedChains, STR_ADDRESS } from '../constants';
import { strAbi } from '../abis';

interface Props {
    chainName: string;
    account: Address;
}

export async function getPendingRewardSTR({ chainName, account }: Props, { getProvider }: FunctionOptions): Promise<FunctionReturn> {
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Sky protocol is not supported on ${chainName}`, true);

    const publicClient = getProvider(chainId);

    const earned = await publicClient.readContract({
        address: STR_ADDRESS,
        abi: strAbi,
        functionName: 'earned',
        args: [account],
    });

    return toResult(`Pending SKY rewards: ${formatUnits(earned, 18)} SKY`);
}

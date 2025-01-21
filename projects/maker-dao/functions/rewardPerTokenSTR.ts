import { formatUnits } from 'viem';
import { FunctionReturn, toResult, getChainFromName, FunctionOptions } from '@heyanon/sdk';
import { supportedChains, STR_ADDRESS } from '../constants';
import { strAbi } from '../abis';

interface Props {
    chainName: string;
}

export async function rewardPerTokenSTR({ chainName }: Props, { getProvider }: FunctionOptions): Promise<FunctionReturn> {
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Sky protocol is not supported on ${chainName}`, true);

    const publicClient = getProvider(chainId);

    const rewardPerToken = await publicClient.readContract({
        address: STR_ADDRESS,
        abi: strAbi,
        functionName: 'rewardPerToken',
        args: [],
    });

    return toResult(`Current reward per staked token: ${formatUnits(rewardPerToken, 18)} SKY`);
}

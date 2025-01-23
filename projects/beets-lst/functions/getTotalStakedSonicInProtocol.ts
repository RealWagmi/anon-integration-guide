import { formatUnits } from 'viem';
import { FunctionReturn, toResult, getChainFromName, FunctionOptions } from '@heyanon/sdk';
import { supportedChains, STS_ADDRESS } from '../constants';
import { stsAbi } from '../abis';

interface Props {
    chainName: string;
}

export async function getTotalStakedSonicInProtocol({ chainName }: Props, { notify, getProvider }: FunctionOptions): Promise<FunctionReturn> {
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Beets protocol is not supported on ${chainName}`, true);

    const publicClient = getProvider(chainId);

    await notify(`Getting total Sonic (S) staked in Beets protocol...`);

    const totalAssets = await publicClient.readContract({
        address: STS_ADDRESS,
        abi: stsAbi,
        functionName: 'totalDelegated',
    });

    return toResult(`Total Sonic staked in protocol: ${formatUnits(totalAssets, 18)} S`);
}

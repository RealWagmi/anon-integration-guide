import { Address, formatUnits } from 'viem';
import { FunctionReturn, toResult, getChainFromName, FunctionOptions } from '@heyanon/sdk';
import { supportedChains, STS_ADDRESS } from '../constants';
import { stsAbi } from '../abis';

interface Props {
    chainName: string;
}

export async function getProtocolStakedSonicToSonicExchangeRate({ chainName }: Props, { notify, getProvider }: FunctionOptions): Promise<FunctionReturn> {
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Beets protocol is not supported on ${chainName}`, true);

    const publicClient = getProvider(chainId);

    await notify(`Getting staked Sonic (stS) exchange rate...`);

    const rate = await publicClient.readContract({
        address: STS_ADDRESS,
        abi: stsAbi,
        functionName: 'getRate',
    });

    return toResult(`1 stS is worth ${formatUnits(rate, 18)} S`);
}

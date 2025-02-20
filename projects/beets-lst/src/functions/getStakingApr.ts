import { FunctionReturn, toResult, FunctionOptions, getChainFromName } from '@heyanon/sdk';
import { supportedChains } from '../constants';
import { fetchStakingAPR } from '../helpers/client';

interface Props {
    chainName: string;
}

export async function getStakingApr({ chainName }: Props, { notify, getProvider }: FunctionOptions): Promise<FunctionReturn> {
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Beets protocol is not supported on ${chainName}`, true);

    const apr = await fetchStakingAPR();
    return toResult(`Staking APR: ${apr}`);
}

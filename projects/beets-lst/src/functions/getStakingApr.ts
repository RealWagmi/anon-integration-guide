import { FunctionReturn, toResult, EVM, EvmChain } from '@heyanon/sdk';
import { supportedChains } from '../constants';
import { fetchStakingAPR } from '../helpers/client';

interface Props {
    chainName: string;
}

export async function getStakingApr({ chainName }: Props): Promise<FunctionReturn> {
    const chainId = EVM.utils.getChainFromName(chainName as EvmChain);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Beets protocol is not supported on ${chainName}`, true);

    const apr = await fetchStakingAPR();
    return toResult(`Staking APR: ${apr}`);
}

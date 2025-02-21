import { FunctionReturn, toResult, EVM, EvmChain } from '@heyanon/sdk';
import { supportedChains } from '../constants';
import { fetchStakingAPR } from '../helpers/client';
import { toSignificant } from '../helpers/amounts';
interface Props {
    chainName: string;
}

/**
 * Retrieves the current Annual Percentage Rate (APR) for staking Sonic (S) tokens via stS.
 *
 * @param {Object} props - The function input parameters
 * @param {string} props.chainName - Name of the blockchain network
 * @returns {Promise<FunctionReturn>} A message including the current staking APR or an error
 */
export async function getStakingApr({ chainName }: Props): Promise<FunctionReturn> {
    const chainId = EVM.utils.getChainFromName(chainName as EvmChain);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Beets protocol is not supported on ${chainName}`, true);

    const apr = await fetchStakingAPR();
    return toResult(`Staking APR: ${toSignificant(apr * 100, 2, 3)}%`);
}

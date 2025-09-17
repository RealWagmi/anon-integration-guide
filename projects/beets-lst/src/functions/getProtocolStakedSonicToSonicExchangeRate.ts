import { formatUnits } from 'viem';
import { FunctionReturn, toResult, EVM, FunctionOptions, EvmChain } from '@heyanon/sdk';
import { supportedChains, STS_ADDRESS } from '../constants';
import { stsAbi } from '../abis';

interface Props {
    chainName: string;
}

/**
 * Fetches the conversion rate that determines how many Sonic tokens (S) each stS token is worth.
 *
 * @param {Object} props - The function input parameters
 * @param {string} props.chainName - Name of the blockchain network
 * @param {FunctionOptions} context - Holds EVM utilities and a notifier
 * @returns {Promise<FunctionReturn>} A message indicating the number of Sonic tokens (S) per stS token
 */
export async function getProtocolStakedSonicToSonicExchangeRate({ chainName }: Props, { notify, evm: { getProvider } }: FunctionOptions): Promise<FunctionReturn> {
    const chainId = EVM.utils.getChainFromName(chainName as EvmChain);
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

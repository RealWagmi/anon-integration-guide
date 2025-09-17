import { formatUnits } from 'viem';
import { FunctionReturn, toResult, EVM, FunctionOptions, EvmChain } from '@heyanon/sdk';
import { supportedChains, STS_ADDRESS } from '../constants';
import { stsAbi } from '../abis';

interface Props {
    chainName: string;
}

/**
 * Fetches the total amount of Sonic tokens (S) the liquid staking protocol currently holds.
 *
 * @param {Object} props - The function input parameters
 * @param {string} props.chainName - Name of the blockchain network
 * @param {FunctionOptions} context - Holds EVM utilities and a notifier
 * @returns {Promise<FunctionReturn>} A message summarizing the total Sonic in the protocol
 */
export async function getTotalSonicInProtocol({ chainName }: Props, { notify, evm: { getProvider } }: FunctionOptions): Promise<FunctionReturn> {
    const chainId = EVM.utils.getChainFromName(chainName as EvmChain);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Beets protocol is not supported on ${chainName}`, true);

    const publicClient = getProvider(chainId);

    await notify(`Getting total Sonic (S) in Beets protocol...`);

    const totalAssets = await publicClient.readContract({
        address: STS_ADDRESS,
        abi: stsAbi,
        functionName: 'totalAssets',
    });

    return toResult(`Total Sonic in protocol: ${formatUnits(totalAssets, 18)} S`);
}

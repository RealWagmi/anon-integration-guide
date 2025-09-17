import { formatUnits } from 'viem';
import { FunctionReturn, toResult, EVM, FunctionOptions, EvmChain } from '@heyanon/sdk';
import { supportedChains, STS_ADDRESS } from '../constants';
import { stsAbi } from '../abis';

interface Props {
    chainName: string;
}

/**
 * Fetches the conversion rate that determines how many stS tokens can be received
 * for each Sonic token (S).
 *
 * @param {Object} props - The function input parameters
 * @param {string} props.chainName - Name of the blockchain network
 * @param {FunctionOptions} context - Holds EVM utilities and a notifier
 * @returns {Promise<FunctionReturn>} A message indicating the number of stS tokens per S
 */
export async function getProtocolSonicToStakedSonicExchangeRate({ chainName }: Props, { notify, evm: { getProvider } }: FunctionOptions): Promise<FunctionReturn> {
    const chainId = EVM.utils.getChainFromName(chainName as EvmChain);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Beets protocol is not supported on ${chainName}`, true);

    const publicClient = getProvider(chainId);

    await notify(`Getting Sonic exchange rate...`);

    const inverseRate = await publicClient.readContract({
        address: STS_ADDRESS,
        abi: stsAbi,
        functionName: 'convertToShares',
        args: [1000000000000000000n],
    });

    return toResult(`1 S is worth ${formatUnits(inverseRate, 18)} stS`);
}

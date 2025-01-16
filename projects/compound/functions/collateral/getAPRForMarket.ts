import { FunctionReturn, toResult, getChainFromName, FunctionOptions } from '@heyanon/sdk';
import { comets, supportedChains } from '../../constants';
import { cometAbi } from '../../abis/cometAbi';

interface Props {
    chainName: string;
    baseAsset: string;
}

export async function getAPRForMarket({ chainName, baseAsset }: Props, { getProvider }: FunctionOptions): Promise<FunctionReturn> {
    // validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Protocol is not supported on ${chainName}`, true);

    // validate market
    if (!comets[chainId][baseAsset]) return toResult(`Unsupported market: ${baseAsset}. Supported markets include: ${Object.keys(comets[chainId]).join(', ')}`, true);
    const marketAddress = comets[chainId][baseAsset].address;

    // get utilization and supply rate
    const publicClient = getProvider(chainId);
    const utilization = await publicClient.readContract({
        address: marketAddress,
        abi: cometAbi,
        functionName: 'getUtilization',
    });

    const supplyRate = await publicClient.readContract({
        address: marketAddress,
        abi: cometAbi,
        functionName: 'getSupplyRate',
        args: [utilization],
    });

    // calculate APR
    const secondsPerYear = 60 * 60 * 24 * 365;
    const apr = Number(supplyRate / 10n ** 18n) * secondsPerYear * 100;

    return toResult(`${baseAsset} Market APR: ${apr} (${utilization}% utilization)`);
}

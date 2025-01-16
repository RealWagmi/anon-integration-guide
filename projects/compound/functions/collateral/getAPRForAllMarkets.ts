import { FunctionReturn, toResult, getChainFromName, FunctionOptions } from '@heyanon/sdk';
import { comets, supportedChains } from '../../constants';
import { cometAbi } from '../../abis/cometAbi';

interface Props {
    chainName: string;
}

export async function getAPRForAllMarkets({ chainName }: Props, { getProvider }: FunctionOptions): Promise<FunctionReturn> {
    // validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Protocol is not supported on ${chainName}`, true);

    const secondsPerYear = 60 * 60 * 24 * 365;
    const publicClient = getProvider(chainId);
    let APRdata = 'APR data for all Compound markets:';

    for (const baseAsset of Object.keys(comets[chainId])) {
        const marketAddress = comets[chainId][baseAsset].address;
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
        const apr = Number(supplyRate / 10n ** 18n) * secondsPerYear * 100;

        APRdata += `${baseAsset} Market APR: ${apr} (${utilization}% utilization)`;
    }

    return toResult(APRdata);
}

import { FunctionReturn, toResult, getChainFromName, FunctionOptions } from '@heyanon/sdk';
import { comets, supportedChains } from '../../constants';
import { cometAbi } from '../../abis/cometAbi';
import { formatUnits } from 'viem';

interface Props {
    chainName: string;
}

export async function getAPRForAllMarkets({ chainName }: Props, { getProvider }: FunctionOptions): Promise<FunctionReturn> {
    // validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Protocol is not supported on ${chainName}`, true);

    const secondsPerYear = 60n * 60n * 24n * 365n;
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
        const apr = formatUnits(supplyRate * secondsPerYear * 100n, 18);
        APRdata += `${baseAsset} Market APR: ${apr} (${formatUnits(utilization, 18)}% utilization)\n`;
    }

    return toResult(APRdata);
}

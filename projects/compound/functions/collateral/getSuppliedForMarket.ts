import { Address, formatUnits } from 'viem';
import { FunctionReturn, toResult, getChainFromName, FunctionOptions } from '@heyanon/sdk';
import { comets, supportedChains } from '../../constants';
import { cometAbi } from '../../abis/cometAbi';

interface Props {
    chainName: string;
    account: Address;
    baseAsset: string;
}

export async function getSuppliedForMarket({ chainName, account, baseAsset }: Props, { getProvider }: FunctionOptions): Promise<FunctionReturn> {
    // validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Protocol is not supported on ${chainName}`, true);

    // validate market
    if (!comets[chainId][baseAsset]) return toResult(`Unsupported market: ${baseAsset}. Supported markets include: ${Object.keys(comets[chainId]).join(', ')}`, true);
    const marketAddress = comets[chainId][baseAsset].address;

    const publicClient = getProvider(chainId);
    const amountSupplied = await publicClient.readContract({
        address: marketAddress,
        abi: cometAbi,
        functionName: 'balanceOf',
        args: [account],
    });

    return toResult(`Amount supplied to ${baseAsset} market: ${formatUnits(amountSupplied, 18)} ${baseAsset}`);
}

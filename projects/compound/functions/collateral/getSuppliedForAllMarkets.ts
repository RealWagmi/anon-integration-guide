import { Address, formatUnits } from 'viem';
import { FunctionReturn, toResult, getChainFromName, FunctionOptions } from '@heyanon/sdk';
import { comets, supportedChains } from '../../constants';
import { cometAbi } from '../../abis/cometAbi';

interface Props {
    chainName: string;
    account: Address;
}

export async function getSuppliedForAllMarkets({ chainName, account }: Props, { getProvider }: FunctionOptions): Promise<FunctionReturn> {
    // validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Protocol is not supported on ${chainName}`, true);

    let supplyMessage = '';
    const publicClient = getProvider(chainId);

    for (const baseToken of Object.keys(comets[chainId])) {
        const marketAddress = comets[chainId][baseToken].address;
        const amountSupplied = await publicClient.readContract({
            address: marketAddress,
            abi: cometAbi,
            functionName: 'balanceOf',
            args: [account],
        });

        supplyMessage += `\nAmount supplied to ${baseToken} market: ${formatUnits(amountSupplied, 18)} ${baseToken}`;
    }

    return toResult(supplyMessage);
}

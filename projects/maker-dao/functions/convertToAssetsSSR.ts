import { Address, parseUnits, formatUnits } from 'viem';
import { FunctionReturn, toResult, getChainFromName, FunctionOptions } from '@heyanon/sdk';
import { supportedChains, SSR_ADDRESS } from '../constants';
import { ssrAbi } from '../abis';

interface Props {
    chainName: string;
    account: Address;
    amount: string;
}

export async function convertToAssetsSSR({ chainName, amount }: Props, { getProvider }: FunctionOptions): Promise<FunctionReturn> {
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Sky protocol is not supported on ${chainName}`, true);

    const amountInWei = parseUnits(amount, 18);
    if (amountInWei === 0n) return toResult('Amount must be greater than 0', true);

    const publicClient = getProvider(chainId);

    const assets = await publicClient.readContract({
        address: SSR_ADDRESS,
        abi: ssrAbi,
        functionName: 'convertToAssets',
        args: [amountInWei],
    });

    return toResult(`${amount} sUSDS = ${formatUnits(assets, 18)} USDS`);
}

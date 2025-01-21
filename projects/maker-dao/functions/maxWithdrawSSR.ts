import { Address, formatUnits } from 'viem';
import { FunctionReturn, toResult, getChainFromName, FunctionOptions } from '@heyanon/sdk';
import { supportedChains, SSR_ADDRESS } from '../constants';
import { ssrAbi } from '../abis';

interface Props {
    chainName: string;
    account: Address;
}

export async function maxWithdrawSSR({ chainName, account }: Props, { getProvider }: FunctionOptions): Promise<FunctionReturn> {
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Sky protocol is not supported on ${chainName}`, true);

    const publicClient = getProvider(chainId);

    const maxWithdraw = await publicClient.readContract({
        address: SSR_ADDRESS,
        abi: ssrAbi,
        functionName: 'maxWithdraw',
        args: [account],
    });

    return toResult(`Maximum withdrawable amount: ${formatUnits(maxWithdraw, 18)} USDS`);
}

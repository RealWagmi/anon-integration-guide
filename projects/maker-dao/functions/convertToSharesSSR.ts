import { Address, parseUnits, formatUnits } from 'viem';
import { FunctionReturn, toResult, FunctionOptions, getChainFromName } from '@heyanon/sdk';
import { supportedChains, SSR_ADDRESS } from '../constants';
import { ssrAbi } from '../abis';

interface Props {
    chainName: string;
    account: Address;
    amount: string;
}

export async function convertToSharesSSR({ chainName, amount }: Props, { getProvider }: FunctionOptions): Promise<FunctionReturn> {
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Sky protocol is not supported on ${chainName}`, true);

    const amountInWei = parseUnits(amount, 18);
    if (amountInWei === 0n) return toResult('Amount must be greater than 0', true);

    const publicClient = getProvider(chainId);

    const shares = await publicClient.readContract({
        address: SSR_ADDRESS,
        abi: ssrAbi,
        functionName: 'convertToShares',
        args: [amountInWei],
    });

    return toResult(`${amount} USDS = ${formatUnits(shares, 18)} sUSDS`);
}

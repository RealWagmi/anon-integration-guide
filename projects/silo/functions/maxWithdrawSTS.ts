import { Address, formatUnits } from 'viem';
import { FunctionReturn, toResult, getChainFromName, FunctionOptions } from '@heyanon/sdk';
import { supportedChains, SILO_BORROWABLE_STS_DEPOSIT_ADDRESS } from '../constants';
import { siloAbi } from '../abis';

interface Props {
    chainName: string;
    account: Address;
}

export async function maxWithdrawSTS({ chainName, account }: Props, { getProvider }: FunctionOptions): Promise<FunctionReturn> {
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Silo protocol is not supported on ${chainName}`, true);

    const publicClient = getProvider(chainId);

    const maxWithdraw = (await publicClient.readContract({
        address: SILO_BORROWABLE_STS_DEPOSIT_ADDRESS,
        abi: siloAbi,
        functionName: 'maxWithdraw',
        args: [account],
    })) as bigint;

    return toResult(`Maximum withdrawable amount: ${formatUnits(maxWithdraw, 18)} stS`);
}

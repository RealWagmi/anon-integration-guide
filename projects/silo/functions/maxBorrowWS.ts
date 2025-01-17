import { Address, formatUnits } from 'viem';
import { FunctionReturn, toResult, getChainFromName, FunctionOptions } from '@heyanon/sdk';
import { supportedChains, BORROWABLE_WS_DEPOSIT_ADDRESS } from '../constants';
import { siloAbi } from '../abis';

interface Props {
    chainName: string;
    account: Address;
}

export async function maxBorrowWS({ chainName, account }: Props, { getProvider }: FunctionOptions): Promise<FunctionReturn> {
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Silo protocol is not supported on ${chainName}`, true);

    const publicClient = getProvider(chainId);

    const maxBorrow = (await publicClient.readContract({
        address: BORROWABLE_WS_DEPOSIT_ADDRESS,
        abi: siloAbi,
        functionName: 'maxBorrow',
        args: [account],
    })) as bigint;

    return toResult(`Maximum borrow amount: ${formatUnits(maxBorrow, 18)} wS`);
}

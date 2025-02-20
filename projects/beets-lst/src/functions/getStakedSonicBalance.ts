import { Address, formatUnits } from 'viem';
import { FunctionReturn, toResult, EVM, FunctionOptions, EvmChain } from '@heyanon/sdk';
import { supportedChains, STS_ADDRESS } from '../constants';
import { stsAbi } from '../abis';

interface Props {
    chainName: string;
    account: Address;
}

export async function getStakedSonicBalance({ chainName, account }: Props, { notify, evm: { getProvider } }: FunctionOptions): Promise<FunctionReturn> {
    const chainId = EVM.utils.getChainFromName(chainName as EvmChain);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Beets protocol is not supported on ${chainName}`, true);

    const publicClient = getProvider(chainId);

    await notify(`Getting staked Sonic (stS) balance...`);

    const balance = await publicClient.readContract({
        address: STS_ADDRESS,
        abi: stsAbi,
        functionName: 'balanceOf',
        args: [account],
    });

    return toResult(`Staked Sonic balance: ${formatUnits(balance, 18)} stS`);
}

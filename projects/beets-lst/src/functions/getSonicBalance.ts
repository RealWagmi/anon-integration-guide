import { Address, formatUnits } from 'viem';
import { FunctionReturn, toResult, EVM, FunctionOptions, EvmChain } from '@heyanon/sdk';
import { supportedChains } from '../constants';

interface Props {
    chainName: string;
    account: Address;
}

export async function getSonicBalance({ chainName, account }: Props, { notify, evm: { getProvider } }: FunctionOptions): Promise<FunctionReturn> {
    const chainId = EVM.utils.getChainFromName(chainName as EvmChain);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Beets protocol is not supported on ${chainName}`, true);

    const publicClient = getProvider(chainId);

    await notify(`Getting Sonic (S) balance...`);

    const balance = await publicClient.getBalance({
        address: account,
    });

    return toResult(`Sonic balance: ${formatUnits(balance, 18)} S`);
}

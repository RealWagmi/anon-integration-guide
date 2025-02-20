import { Address, erc20Abi, formatUnits } from 'viem';
import { EVM, EvmChain, FunctionReturn, toResult, FunctionOptions } from '@heyanon/sdk';
import { supportedChains } from '../constants';
import { getGqlTokenByAddress } from '../helpers/tokens';

interface Props {
    chainName: string;
    account: Address;
    tokenAddress: Address;
}

export async function getTokenBalance({ chainName, account, tokenAddress }: Props, { notify, evm: { getProvider } }: FunctionOptions): Promise<FunctionReturn> {
    const chainId = EVM.utils.getChainFromName(chainName as EvmChain);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Beets protocol is not supported on ${chainName}`, true);

    const token = await getGqlTokenByAddress(chainName, tokenAddress);
    if (!token) return toResult(`Token not found: ${tokenAddress}`, true);

    const publicClient = getProvider(chainId);

    await notify(`Getting ${token.symbol} balance...`);

    const balance = await publicClient.readContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [account],
    });

    return toResult(`${token.symbol} balance: ${formatUnits(balance, token.decimals)}`);
}

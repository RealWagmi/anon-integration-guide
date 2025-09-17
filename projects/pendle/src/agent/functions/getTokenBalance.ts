import { Address, erc20Abi, formatUnits } from 'viem';
import { EVM, EvmChain, FunctionReturn, toResult, FunctionOptions } from '@heyanon/sdk';
import { supportedChains } from '../../constants';
import { getTokenInfoFromAddress } from '../tokens';

interface Props {
    chainName: string;
    account: Address;
    tokenAddress: Address;
}

/**
 * Gets the token balance for a specific account.
 * Returns balance in human readable format.
 *
 * @param {Object} props - The input parameters
 * @param {string} props.chainName - Name of the blockchain network
 * @param {Address} props.account - Address to check balance for
 * @param {Address} props.tokenAddress - Address of token to check
 * @param {FunctionOptions} options - HeyAnon SDK options, including provider and notification handlers
 * @returns {Promise<FunctionReturn>} Token balance with symbol
 */
export async function getTokenBalance({ chainName, account, tokenAddress }: Props, { notify, evm: { getProvider } }: FunctionOptions): Promise<FunctionReturn> {
    const chainId = EVM.utils.getChainFromName(chainName as EvmChain);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Beefy protocol is not supported on ${chainName}`, true);

    const token = await getTokenInfoFromAddress(chainName as EvmChain, tokenAddress);
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

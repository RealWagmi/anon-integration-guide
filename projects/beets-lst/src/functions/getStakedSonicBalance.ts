import { Address, formatUnits } from 'viem';
import { FunctionReturn, toResult, EVM, FunctionOptions, EvmChain } from '@heyanon/sdk';
import { supportedChains, STS_ADDRESS } from '../constants';
import { stsAbi } from '../abis';

interface Props {
    chainName: string;
    account: Address;
}

/**
 * Shows the staked Sonic (stS) token balance of the specified address.
 *
 * @param {Object} props - The function input parameters
 * @param {string} props.chainName - Name of the blockchain network
 * @param {Address} props.account - The account address whose stS balance is retrieved
 * @param {FunctionOptions} context - Holds EVM utilities and a notifier
 * @returns {Promise<FunctionReturn>} A message detailing the user's stS balance
 */
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

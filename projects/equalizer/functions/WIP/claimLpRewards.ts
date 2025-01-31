import { Address, encodeFunctionData, getAddress } from 'viem';
import { FunctionReturn, FunctionOptions, TransactionParams, toResult, getChainFromName } from '@heyanon/sdk';
import { supportedChains } from '../../constants';
import { gaugeAbi } from '../../abis';
import { getMinimalPairs } from '../../lib/api/pairs';

interface Props {
    chainName: string;
    account: Address;
    lpAddress: Address;
}

// TODO: Figure out where to get Gauge tokens

/**
 * Claims rewards from an Equalizer gauge LP position.
 * @param props - The claim parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Transaction result.
 */
export async function claimLpRewards({ chainName, account, lpAddress }: Props, { sendTransactions, notify, getProvider }: FunctionOptions): Promise<FunctionReturn> {
    if (!account) return toResult('Wallet not connected', true);

    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Equalizer is not supported on ${chainName}`, true);

    const minimnalPairs = await getMinimalPairs();
    const pairData = minimnalPairs.get(getAddress(lpAddress));

    if (!pairData) return toResult(`Pair with address ${lpAddress} not found`, true);

    if (!pairData.gauge?.address) return toResult(`Pair with address ${lpAddress} does not have a gauge`, true);

    await notify('Preparing to claim LP rewards...');

    const claimTx: TransactionParams = {
        target: getAddress(pairData.gauge.address),
        data: encodeFunctionData({
            abi: gaugeAbi,
            functionName: 'getReward',
            args: [account, [pairData.gauge]],
        }),
    };

    await notify('Waiting for transaction confirmation...');

    const result = await sendTransactions({ chainId, account, transactions: [claimTx] });
    const claimMessage = result.data[result.data.length - 1];

    return toResult(result.isMultisig ? claimMessage.message : `Successfully claimed LP rewards. ${claimMessage.message}`);
}

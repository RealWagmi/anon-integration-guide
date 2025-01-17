import { Address, encodeFunctionData } from 'viem';
import { FunctionReturn, FunctionOptions, TransactionParams, toResult, getChainFromName } from '@heyanon/sdk';
import { supportedChains, VOTER_ADDRESS } from '../constants';
import { voterAbi } from '../abis';

interface Props {
    chainName: string;
    account: Address;
    tokenId: number;
    gauges: Address[];
    gtokens: Address[][];
    bribes: Address[];
    btokens: Address[][];
}

/**
 * Claims all rewards from voting with a veNFT including gauge and bribe rewards.
 * @param props - The claim parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Transaction result.
 */
export async function claimAllRewards(
    { chainName, account, tokenId, gauges, gtokens, bribes, btokens }: Props,
    { sendTransactions, notify, getProvider }: FunctionOptions
): Promise<FunctionReturn> {
    // Check wallet connection
    if (!account) return toResult('Wallet not connected', true);

    // Validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Equalizer is not supported on ${chainName}`, true);

    // Validate arrays
    if (!gauges?.length || !gtokens?.length || !bribes?.length || !btokens?.length) {
        return toResult('No rewards to claim', true);
    }

    if (gtokens.length !== gauges.length || btokens.length !== bribes.length) {
        return toResult(`Received missmatched gauge or bribe tokens.`);
    }

    // Validate tokenId
    if (tokenId < 0) return toResult('Invalid token ID', true);

    await notify('Preparing to claim rewards...');

    // Prepare claim transaction
    const claimTx: TransactionParams = {
        target: VOTER_ADDRESS,
        data: encodeFunctionData({
            abi: voterAbi,
            functionName: 'claimEverything',
            args: [gauges, gtokens, bribes, btokens, BigInt(tokenId)],
        }),
    };

    await notify('Waiting for transaction confirmation...');

    // Sign and send transaction
    const result = await sendTransactions({ chainId, account, transactions: [claimTx] });
    const claimMessage = result.data[result.data.length - 1];

    return toResult(result.isMultisig ? claimMessage.message : `Successfully claimed all rewards for veNFT #${tokenId}. ${claimMessage.message}`);
}

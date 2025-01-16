import { Address, encodeFunctionData } from 'viem';
import { FunctionReturn, FunctionOptions, TransactionParams, toResult, getChainFromName } from '@heyanon/sdk';
import { supportedChains, VOTER_ADDRESS } from '../constants';
import { voterAbi } from '../abis';

interface Props {
    chainName: string;
    account: Address;
    tokenId: number;
    bribes: Address[];
    btokens: Address[][];
}

/**
 * Claims all NFT bribes rewards from voting with a veNFT.
 * @param props - The claim parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Transaction result.
 */
export async function claimNftBribes({ chainName, account, tokenId, bribes, btokens }: Props, { sendTransactions, notify, getProvider }: FunctionOptions): Promise<FunctionReturn> {
    if (!account) return toResult('Wallet not connected', true);

    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Equalizer is not supported on ${chainName}`, true);

    if (!bribes?.length || !btokens?.length) {
        return toResult('No bribes to claim', true);
    }

    if (btokens.length !== bribes.length) {
        return toResult(`Received mismatched bribe tokens.`);
    }

    if (tokenId < 0) return toResult('Invalid token ID', true);

    await notify('Preparing to claim NFT bribes...');

    const claimTx: TransactionParams = {
        target: VOTER_ADDRESS,
        data: encodeFunctionData({
            abi: voterAbi,
            functionName: 'claimEverything',
            args: [[], [], bribes, btokens, BigInt(tokenId)],
        }),
    };

    await notify('Waiting for transaction confirmation...');

    const result = await sendTransactions({ chainId, account, transactions: [claimTx] });
    const claimMessage = result.data[result.data.length - 1];

    return toResult(result.isMultisig ? claimMessage.message : `Successfully claimed NFT bribes for veNFT #${tokenId}. ${claimMessage.message}`);
}

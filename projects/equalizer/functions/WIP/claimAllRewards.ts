import { Address, encodeFunctionData, getAddress } from 'viem';
import { FunctionReturn, FunctionOptions, TransactionParams, toResult, getChainFromName } from '@heyanon/sdk';
import { supportedChains, VOTER_ADDRESS } from '../../constants';
import { voterAbi } from '../../abis';
import { getNftRewards } from '../../lib/api/nft-rewards';

interface Props {
    chainName: string;
    account: Address;
    tokenId: number;
}

//TODO: Figure out where to find the gauge rewards

export async function claimAllRewards({ chainName, account, tokenId }: Props, { sendTransactions, notify, getProvider }: FunctionOptions): Promise<FunctionReturn> {
    if (!account) return toResult('Wallet not connected', true);

    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Equalizer is not supported on ${chainName}`, true);

    if (tokenId < 0) return toResult('Invalid token ID', true);

    const nftRewards = await getNftRewards(tokenId);

    if (nftRewards.size === 0) {
        return toResult('No rewards to claim', true);
    }

    const rewardSummary = Array.from(nftRewards.values())
        .flatMap((reward) => reward.tokens.map((token) => `${token.amount.value} ${token.symbol} from ${reward.pair.displayName}`))
        .join(', ');

    await notify(`Found rewards to claim: ${rewardSummary}`);

    const gauges: Address[] = [];
    const gtokens: Address[][] = [];
    const bribes: Address[] = [];
    const btokens: Address[][] = [];

    for (const reward of nftRewards.values()) {
        if (reward.pair.gauge?.address) {
            gauges.push(getAddress(reward.pair.gauge.address));
            gtokens.push(reward.tokens.map((v) => getAddress(v.address)));
        } else {
            bribes.push(getAddress(reward.bribeAddress));
            btokens.push(reward.tokens.map((v) => getAddress(v.address)));
        }
    }

    const claimTx: TransactionParams = {
        target: VOTER_ADDRESS,
        data: encodeFunctionData({
            abi: voterAbi,
            functionName: 'claimEverything',
            args: [gauges, gtokens, bribes, btokens, BigInt(tokenId)],
        }),
    };

    await notify('Waiting for transaction confirmation...');

    const result = await sendTransactions({ chainId, account, transactions: [claimTx] });
    const claimMessage = result.data[result.data.length - 1];

    return toResult(result.isMultisig ? claimMessage.message : `Successfully claimed all rewards for veNFT #${tokenId}. ${claimMessage.message}`);
}

import { Address, encodeFunctionData } from 'viem';
import { FunctionReturn, FunctionOptions, TransactionParams, toResult, getChainFromName } from '@heyanon/sdk';
import { supportedChains, VE_EQUAL_ADDRESS } from '../constants';
import { veNftAbi } from '../abis/veNftAbi';
import { getWalletNfts } from '../lib/api/wallet-nfts';

interface Props {
    chainName: string;
    account: Address;
}

export async function withdrawTokensFromExpiredVe({ chainName, account }: Props, { sendTransactions, notify }: FunctionOptions): Promise<FunctionReturn> {
    if (!account) return toResult('Wallet not connected', true);

    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Equalizer is not supported on ${chainName}`, true);

    const tokens = await getWalletNfts(account);

    const expiredNfts = tokens.filter((v) => v.hasExpired);

    if (expiredNfts.length === 0) return toResult('No expired NFTs found', true);

    await notify(`Found ${expiredNfts.length} expired NFTs`);

    await notify('Preparing to withdraw tokens from expired NFTs...');

    const transactions: TransactionParams[] = [];
    for (const nft of expiredNfts) {
        const withdrawTx: TransactionParams = {
            target: VE_EQUAL_ADDRESS,
            data: encodeFunctionData({
                abi: veNftAbi,
                functionName: 'withdraw',
                args: [BigInt(nft.id)],
            }),
        };
        transactions.push(withdrawTx);
    }

    await notify('Waiting for transaction confirmation...');

    const result = await sendTransactions({ chainId, account, transactions });
    const withdrawMessage = result.data[result.data.length - 1];

    return toResult(result.isMultisig ? withdrawMessage.message : `Successfully withdrew tokens from expired vested position. ${withdrawMessage.message}`);
}

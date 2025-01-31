import { Address, encodeFunctionData } from 'viem';
import { FunctionReturn, FunctionOptions, TransactionParams, toResult, getChainFromName } from '@heyanon/sdk';
import { supportedChains } from '../../constants';
import { thickNftAbi } from '../../abis/thickNft';
interface Props {
    chainName: string;
    account: Address;
    tokenId: number;
}

/**
 * Collects accumulated fees from a Thick NFT Position.
 * @param props - The collect parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Transaction result.
 */
export async function collectFeesFromThickNftPosition({ chainName, account, tokenId }: Props, { sendTransactions, notify, getProvider }: FunctionOptions): Promise<FunctionReturn> {
    if (!account) return toResult('Wallet not connected', true);

    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Equalizer is not supported on ${chainName}`, true);

    if (tokenId < 0) return toResult('Invalid token ID', true);

    await notify('Preparing to collect fees...');

    const params = {
        tokenId: BigInt(tokenId),
        recipient: account,
        amount0Max: BigInt(1e36),
        amount1Max: BigInt(1e36),
    };

    const collectTx: TransactionParams = {
        target: nftMana,
        data: encodeFunctionData({
            abi: thickNftAbi,
            functionName: 'collect',
            args: [params],
        }),
    };

    await notify('Waiting for transaction confirmation...');

    const result = await sendTransactions({ chainId, account, transactions: [collectTx] });
    const collectMessage = result.data[result.data.length - 1];

    return toResult(result.isMultisig ? collectMessage.message : `Successfully collected fees from Thick NFT Position #${tokenId}. ${collectMessage.message}`);
}

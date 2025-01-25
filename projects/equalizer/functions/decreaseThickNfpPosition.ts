import { Address, encodeFunctionData } from 'viem';
import { FunctionReturn, FunctionOptions, TransactionParams, toResult, getChainFromName } from '@heyanon/sdk';
import { supportedChains } from '../constants';
import { thickNftAbi } from '../abis/thickNft';

interface Props {
    chainName: string;
    account: Address;
    tokenId: string;
    liquidity: string;
    amount0Min: string;
    amount1Min: string;
    deadline?: number;
    nfpManagerAddress: Address;
}

/**
 * Decreases liquidity from a Thick NFP position and collects fees
 * @param props - The decrease liquidity parameters
 * @param options - System tools for blockchain interactions
 * @returns Transaction result
 */
export async function decreaseThickNfpPosition(
    {
        chainName,
        account,
        tokenId,
        liquidity,
        amount0Min,
        amount1Min,
        deadline = Math.floor(Date.now() / 1000) + 1200, // 20 minutes from now
        nfpManagerAddress,
    }: Props,
    { sendTransactions, notify, getProvider }: FunctionOptions
): Promise<FunctionReturn> {
    // Check wallet connection
    if (!account) return toResult('Wallet not connected', true);

    // Validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Equalizer is not supported on ${chainName}`, true);

    // Validate addresses and amounts
    if (!nfpManagerAddress) return toResult('NFP manager address is required', true);

    const tokenIdBn = BigInt(tokenId);
    const liquidityBn = BigInt(liquidity);
    const amount0MinBn = BigInt(amount0Min);
    const amount1MinBn = BigInt(amount1Min);

    if (liquidityBn <= 0n) return toResult('Liquidity amount must be greater than 0', true);
    if (amount0MinBn < 0n || amount1MinBn < 0n) return toResult('Minimum amounts cannot be negative', true);

    await notify('Preparing to decrease Thick NFT position...');

    const transactions: TransactionParams[] = [];

    const decreaseParams = {
        tokenId: tokenIdBn,
        liquidity: liquidityBn,
        amount0Min: amount0MinBn,
        amount1Min: amount1MinBn,
        deadline: BigInt(deadline),
    };

    const tx1Data = encodeFunctionData({
        abi: thickNftAbi,
        functionName: 'decreaseLiquidity',
        args: [decreaseParams],
    });

    const collectParams = {
        tokenId: tokenIdBn,
        recipient: account,
        amount0Max: BigInt(1e36),
        amount1Max: BigInt(1e36),
    };

    const tx2Data = encodeFunctionData({
        abi: thickNftAbi,
        functionName: 'collect',
        args: [collectParams],
    });

    const multicallTx: TransactionParams = {
        target: nfpManagerAddress,
        data: encodeFunctionData({
            abi: thickNftAbi,
            functionName: 'multicall',
            args: [[tx1Data, tx2Data]],
        }),
    };
    transactions.push(multicallTx);

    await notify('Waiting for transaction confirmation...');

    const result = await sendTransactions({ chainId, account, transactions });
    const decreaseMessage = result.data[result.data.length - 1];

    return toResult(result.isMultisig ? decreaseMessage.message : `Successfully decreased Thick NFT position. ${decreaseMessage.message}`);
}

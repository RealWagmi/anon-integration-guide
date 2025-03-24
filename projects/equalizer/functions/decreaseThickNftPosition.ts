import { Address, encodeFunctionData } from 'viem';
import { FunctionReturn, FunctionOptions, TransactionParams, toResult, getChainFromName } from '@heyanon/sdk';
import { supportedChains, THICKNFT_MANAGER_ADDRESS } from '../constants';
import { thickNftAbi } from '../abis/thickNft';

interface Props {
    chainName: string;
    account: Address;
    tokenId: string;
    percentageToRemove: number; // percentage of liquidity to remove (1-100)
    slippageTolerance?: number; // percentage, e.g., 0.5 for 0.5%
}

/**
 * Decreases liquidity from a Thick NFP position and collects fees
 * @param props - The decrease liquidity parameters
 * @param options - System tools for blockchain interactions
 * @returns Transaction result
 */
export async function decreaseThickNftPosition(
    { chainName, account, tokenId, percentageToRemove, slippageTolerance = 0.5 }: Props,
    { sendTransactions, notify, getProvider }: FunctionOptions
): Promise<FunctionReturn> {
    // Check wallet connection
    if (!account) return toResult('Wallet not connected', true);

    // Validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Equalizer is not supported on ${chainName}`, true);

    const provider = getProvider(chainId);

    // Get position details from the contract
    const position = await provider.readContract({
        address: THICKNFT_MANAGER_ADDRESS,
        abi: thickNftAbi,
        functionName: 'positions',
        args: [BigInt(tokenId)],
    });

    if (!position) return toResult('Position not found', true);

    // Calculate liquidity to remove
    const totalLiquidity = position[7];
    const liquidityToRemove = (totalLiquidity * BigInt(percentageToRemove)) / 100n;

    if (liquidityToRemove <= 0n) return toResult('Amount to remove must be greater than 0', true);

    // Calculate minimum amounts based on uncollected fees
    const amount0Min = (position[10] * BigInt(100 - slippageTolerance)) / 100n;
    const amount1Min = (position[11] * BigInt(100 - slippageTolerance)) / 100n;

    await notify(`Preparing to remove ${percentageToRemove}% liquidity from position #${tokenId}`);

    const deadline = Math.floor(Date.now() / 1000) + 300; // 5 minutes

    const decreaseParams = {
        tokenId: BigInt(tokenId),
        liquidity: liquidityToRemove,
        amount0Min,
        amount1Min,
        deadline: BigInt(deadline),
    };

    const tx1Data = encodeFunctionData({
        abi: thickNftAbi,
        functionName: 'decreaseLiquidity',
        args: [decreaseParams],
    });

    const collectParams = {
        tokenId: BigInt(tokenId),
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
        target: THICKNFT_MANAGER_ADDRESS,
        data: encodeFunctionData({
            abi: thickNftAbi,
            functionName: 'multicall',
            args: [[tx1Data, tx2Data]],
        }),
    };

    await notify('Waiting for transaction confirmation...');

    const result = await sendTransactions({ chainId, account, transactions: [multicallTx] });
    const decreaseMessage = result.data[result.data.length - 1];

    return toResult(result.isMultisig ? decreaseMessage.message : `Successfully decreased Thick NFT position and collected fees. ${decreaseMessage.message}`);
}

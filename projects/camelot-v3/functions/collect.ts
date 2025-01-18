import { FunctionOptions, FunctionReturn, getChainFromName, toResult, TransactionParams } from '@heyanon/sdk';
import { Address, encodeFunctionData, PublicClient } from 'viem';
import { ADDRESSES, MAX_UINT128, PERCENTAGE_BASE, SUPPORTED_CHAINS, ZERO_ADDRESS } from '../constants';
import { amountToWei } from '../utils';
import { nonFungiblePositionManagerAbi } from '../abis';
import { queryLPPositions } from './getLPPositions';

interface Props {
    chainName: string;
    account: Address;
    tokenA: Address;
    tokenB: Address;
    tokenId?: number;
    collectPercentage?: number;
    amountAMax?: string;
    amountBMax?: string;
    recipient?: Address;
}

export async function collect(
    { chainName, account, tokenA, tokenB, tokenId, collectPercentage, amountAMax, amountBMax, recipient }: Props,
    { sendTransactions, notify, getProvider }: FunctionOptions,
): Promise<FunctionReturn> {
    try {
        // Check wallet connection
        if (!account) return toResult('Wallet not connected', true);

        // Validate chain
        const chainId = getChainFromName(chainName);
        if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
        if (!SUPPORTED_CHAINS.includes(chainId)) return toResult(`Camelot V3 is not supported on ${chainName}`, true);

        await notify(`Collecting fees on Camelot V3...`);

        // Determine position ID
        let positionId: bigint;
        if (!tokenId) {
            const positions = await queryLPPositions(chainId, account, tokenA, tokenB);

            // Ensure we are collecting fees from a specific position
            if (positions.length > 1) {
                return toResult(`There are multiple LP positions, please provide a specific position ID to collect fees from`, true);
            }

            positionId = BigInt(positions[0].id);
        } else {
            positionId = BigInt(tokenId!);
        }

        const provider = getProvider(chainId);

        // Get LP position data
        const positionData = await getPositionData(chainId, provider, positionId);
        if (!positionData) return toResult(`Position with ID ${positionId} not found`, true);

        const transactions: TransactionParams[] = [];
        const collectTxData = await prepareCollectTxData(
            chainId,
            provider,
            positionId,
            positionData[2],
            positionData[3],
            recipient ?? account,
            collectPercentage,
            amountAMax,
            amountBMax,
        );
        transactions.push(collectTxData);

        await notify('Waiting for collect fees transaction confirmation...');

        const result = await sendTransactions({ chainId, account, transactions });
        const collectFees = result.data[result.data.length - 1];

        return toResult(result.isMultisig ? collectFees.message : `Successfully collected fees on Camelot V3. ${collectFees.message}`);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return toResult(errorMessage, true);
    }
}

async function getPositionData(chainId: number, provider: PublicClient, positionId: bigint): Promise<any | undefined> {
    try {
        return await provider.readContract({
            address: ADDRESSES[chainId].NONFUNGIBLE_POSITION_MANAGER_ADDRESS,
            abi: nonFungiblePositionManagerAbi,
            functionName: 'positions',
            args: [positionId],
        });
    } catch (error) {
        return undefined;
    }
}

export async function prepareCollectTxData(
    chainId: number,
    provider: PublicClient,
    positionId: bigint,
    token0: Address,
    token1: Address,
    recipient: Address,
    feePercentage?: number,
    amountAMax?: string,
    amountBMax?: string,
): Promise<TransactionParams> {
    // Convert amounts to wei
    let [amountAMaxWei, amountBMaxWei] = await Promise.all([amountToWei(provider, token0, amountAMax), amountToWei(provider, token1, amountBMax)]);

    // Recalculate amounts if fee percentage is provided
    if (feePercentage) {
        [amountAMaxWei, amountBMaxWei] = await feePercentageToMaxAmountOut(chainId, provider, positionId, BigInt(feePercentage));
    }

    // Collect 100% of fees if no percentage and amounts are provided
    if (!feePercentage && !amountAMax && !amountBMax) {
        [amountAMaxWei, amountBMaxWei] = await feePercentageToMaxAmountOut(chainId, provider, positionId, PERCENTAGE_BASE);
    }

    // Validate amounts
    if (amountAMaxWei === 0n && amountBMaxWei === 0n) throw Error(`Nothing to collect, since both amounts are 0`);

    // Prepare collect transaction
    return {
        target: ADDRESSES[chainId].NONFUNGIBLE_POSITION_MANAGER_ADDRESS,
        data: encodeFunctionData({
            abi: nonFungiblePositionManagerAbi,
            functionName: 'collect',
            args: [
                {
                    tokenId: positionId,
                    amount0Max: amountAMaxWei,
                    amount1Max: amountBMaxWei,
                    recipient: recipient,
                },
            ],
        }),
    };
}

async function feePercentageToMaxAmountOut(chainId: number, provider: PublicClient, positionId: bigint, feePercentage: bigint): Promise<bigint[]> {
    const collectData = await provider.simulateContract({
        address: ADDRESSES[chainId].NONFUNGIBLE_POSITION_MANAGER_ADDRESS,
        abi: nonFungiblePositionManagerAbi,
        functionName: 'collect',
        args: [
            {
                tokenId: positionId,
                amount0Max: MAX_UINT128,
                amount1Max: MAX_UINT128,
                recipient: ZERO_ADDRESS,
            },
        ],
    });

    const [amount0Max, amount1Max] = collectData.result;

    return [(amount0Max * feePercentage) / PERCENTAGE_BASE, (amount1Max * feePercentage) / PERCENTAGE_BASE];
}

import { FunctionOptions, FunctionReturn, getChainFromName, toResult, TransactionParams } from '@heyanon/sdk';
import { Address, encodeFunctionData, parseEventLogs, PublicClient } from 'viem';
import { ADDRESSES, MAX_UINT128, PERCENTAGE_BASE, SUPPORTED_CHAINS, ZERO_ADDRESS } from '../constants';
import { amountToWei, getSymbol, weiToAmount } from '../utils';
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

        // Validate tokenId
        if (tokenId && (!Number.isInteger(tokenId) || tokenId < 0)) {
            return toResult(`Invalid token ID: ${tokenId}, please provide a whole non-negative number`, true);
        }

        // Validate collectPercentage
        if (collectPercentage && (!Number.isInteger(collectPercentage) || collectPercentage < 0)) {
            return toResult(`Invalid collect percentage: ${collectPercentage}, please provide a whole non-negative number`, true);
        }

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
            positionId = BigInt(tokenId);
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

        if (result.isMultisig) {
            return toResult(collectFees.message);
        }

        if (!collectFees.hash) {
            return toResult(`Tried to collect fees on Camelot V3, but failed to receive tx hash. ${collectFees.message}`);
        }

        const receipt = await provider.getTransactionReceipt({ hash: collectFees.hash });

        const collectEvents = parseEventLogs({
            logs: receipt.logs,
            abi: nonFungiblePositionManagerAbi,
            eventName: 'Collect',
        });

        const collectEvent = collectEvents.find((log) => log.args.tokenId == positionId);
        if (!collectEvent) {
            return toResult(`Collected fees on Camelot V3, but couldn't verify collected amounts. ${JSON.stringify(collectFees)}`);
        }

        const token0 = positionData[2];
        const token1 = positionData[3];
        const [symbol0, symbol1, amount0, amount1] = await Promise.all([getSymbol(provider, token0), getSymbol(provider, token1), weiToAmount(provider, token0, collectEvent.args.amount0), weiToAmount(provider, token1, collectEvent.args.amount1)]);

        return toResult(`Successfully collected fees [${amount0} ${symbol0}, ${amount1} ${symbol1}] on Camelot V3. ${collectFees.message}`);
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
    collectPercentage?: number,
    amountAMax?: string,
    amountBMax?: string,
): Promise<TransactionParams> {
    // Convert amounts to wei
    let [amountAMaxWei, amountBMaxWei] = await Promise.all([amountToWei(provider, token0, amountAMax), amountToWei(provider, token1, amountBMax)]);

    // Recalculate amounts if fee percentage is provided
    if (collectPercentage) {
        let collectPercentageBigInt = BigInt(collectPercentage);

        [amountAMaxWei, amountBMaxWei] = await collectPercentageToMaxAmountOut(chainId, provider, positionId, collectPercentageBigInt);
    }

    // Collect 100% of fees if no percentage and amounts are provided
    if (!collectPercentage && !amountAMax && !amountBMax) {
        [amountAMaxWei, amountBMaxWei] = await collectPercentageToMaxAmountOut(chainId, provider, positionId, PERCENTAGE_BASE);
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

async function collectPercentageToMaxAmountOut(chainId: number, provider: PublicClient, positionId: bigint, collectPercentage: bigint): Promise<bigint[]> {
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

    return [(amount0Max * collectPercentage) / PERCENTAGE_BASE, (amount1Max * collectPercentage) / PERCENTAGE_BASE];
}

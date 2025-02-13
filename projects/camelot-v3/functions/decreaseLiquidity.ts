import { FunctionOptions, FunctionReturn, getChainFromName, toResult, TransactionParams } from '@heyanon/sdk';
import { Address, encodeFunctionData, Hex, PublicClient } from 'viem';
import { ADDRESSES, PERCENTAGE_BASE, SUPPORTED_CHAINS, ZERO_ADDRESS } from '../constants';
import { algebraFactoryAbi, algebraPoolAbi, nonFungiblePositionManagerAbi } from '../abis';
import { amountToWei } from '../utils';
import { queryLPPositions } from './getLPPositions';
import { prepareCollectTxData } from './collect';

interface Props {
    chainName: string;
    account: Address;
    tokenA: Address;
    tokenB: Address;
    decreasePercentage: number;
    tokenId?: number;
    amountAMin?: string;
    amountBMin?: string;
}

export async function decreaseLiquidity(
    { chainName, account, tokenA, tokenB, decreasePercentage, tokenId, amountAMin, amountBMin }: Props,
    { sendTransactions, notify, getProvider }: FunctionOptions,
): Promise<FunctionReturn> {
    // Check wallet connection
    if (!account) return toResult('Wallet not connected', true);

    // Validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!SUPPORTED_CHAINS.includes(chainId)) return toResult(`Camelot V3 is not supported on ${chainName}`, true);

    // Validate tokenId
    if(tokenId && (!Number.isInteger(tokenId) || tokenId < 0)) {
        return toResult(`Invalid token ID: ${tokenId}, please provide a whole non-negative number`, true);
    }

    // Validate decreasePercentage
    if(decreasePercentage && (!Number.isInteger(decreasePercentage) || decreasePercentage < 0)) {
        return toResult(`Invalid decrease percentage: ${decreasePercentage}, please provide a whole non-negative number`, true);
    }

    await notify(`Preparing to decrease liquidity on Camelot V3...`);

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
        positionId =  BigInt(tokenId);
    }

    const provider = getProvider(chainId);

    // Get LP position data
    const positionData = await getPositionData(chainId, provider, positionId);
    if (!positionData) return toResult(`Position with ID ${positionId} not found`, true);

    let decreasePercentageBigInt = BigInt(decreasePercentage);
    const liquidityToRemove = (BigInt(positionData[6]) * decreasePercentageBigInt) / PERCENTAGE_BASE;

    // Remap tokenAB to token01
    let [[token0, token0Symbol, amount0MinWei], [token1, token1Symbol, amount1MinWei]] = await tokenABToToken01(
        provider,
        positionData[2],
        positionData[3],
        tokenA,
        amountAMin,
        tokenB,
        amountBMin,
    );

    // Simulate decrease liquidity amounts if amount0Min and/or amount1Min are not provided
    if (amount0MinWei == 0n || amount1MinWei == 0n) {
        const [simulatedAmount0, simulatedAmount1] = await simulateDecreaseLiquidityAmounts(chainId, provider, positionId, liquidityToRemove);

        // Set 0.2% slippage tolerance
        if (amount0MinWei == 0n) {
            amount0MinWei = (simulatedAmount0 * 9998n) / 10000n;
        }

        if (amount1MinWei == 0n) {
            amount1MinWei = (simulatedAmount1 * 9998n) / 10000n;
        }
    }

    // Validate amounts
    const tickLower = positionData[4];
    const tickUpper = positionData[5];

    const pool = await getPool(chainId, provider, token0, token1);
    if (!pool || pool === ZERO_ADDRESS) return toResult(`Pool not found for ${token0} and ${token1}`, true);

    const currentTick = await getCurrentTick(provider, pool!);

    if (currentTick >= tickLower && currentTick <= tickUpper) {
        // Two-sided liquidity position
        if (amount0MinWei === 0n) return toResult(`Amount ${token0Symbol} MIN must be greater than 0`, true);

        if (amount1MinWei === 0n) return toResult(`Amount ${token1Symbol} MIN must be greater than 0`, true);
    } else if (currentTick < tickLower) {
        // Single-sided liquidity position - token0
        if (amount0MinWei === 0n) return toResult(`Amount ${token0Symbol} MIN must be greater than 0`, true);
    } else if (currentTick > tickUpper) {
        // Single-sided liquidity position - token1
        if (amount1MinWei === 0n) return toResult(`Amount ${token1Symbol} MIN must be greater than 0`, true);
    }

    const transactions: TransactionParams[] = [];

    // Prepare decrease liquidity transaction
    const multicallTransactionsTxData: Hex[] = [];

    const decreaseLiquidityTxData = encodeFunctionData({
        abi: nonFungiblePositionManagerAbi,
        functionName: 'decreaseLiquidity',
        args: [
            {
                tokenId: positionId,
                liquidity: liquidityToRemove,
                amount0Min: amount0MinWei,
                amount1Min: amount1MinWei,
                deadline: BigInt(Math.floor(Date.now() / 1000) + 60 * 5), // 5 minutes from now
            },
        ],
    });
    multicallTransactionsTxData.push(decreaseLiquidityTxData);

    if (decreasePercentageBigInt == PERCENTAGE_BASE) {
        const collectTxData = await prepareCollectTxData(chainId, provider, positionId, token0, token1, account, Number(PERCENTAGE_BASE));

        const burnTxData = encodeFunctionData({
            abi: nonFungiblePositionManagerAbi,
            functionName: 'burn',
            args: [positionId],
        });

        multicallTransactionsTxData.push(collectTxData.data);
        multicallTransactionsTxData.push(burnTxData);
    }

    // Wrap into multicall
    const multicallTx: TransactionParams = {
        target: ADDRESSES[chainId].NONFUNGIBLE_POSITION_MANAGER_ADDRESS,
        data: encodeFunctionData({
            abi: nonFungiblePositionManagerAbi,
            functionName: 'multicall',
            args: [multicallTransactionsTxData],
        }),
    };

    transactions.push(multicallTx);

    await notify('Waiting for decrease liquidity transaction confirmation...');

    const result = await sendTransactions({ chainId, account, transactions });
    const decreaseLiquidity = result.data[result.data.length - 1];

    return toResult(result.isMultisig ? decreaseLiquidity.message : `Successfully decreased liquidity on Camelot V3. ${decreaseLiquidity.message}`);
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

async function tokenABToToken01(
    provider: PublicClient,
    token0: Address,
    token1: Address,
    tokenA: Address,
    amountAMin: string | undefined,
    tokenB: Address,
    amountBMin: string | undefined,
): Promise<[Address, string, bigint][]> {
    // Convert amounts to wei
    let [amountAMinWei, amountBMinWei] = await Promise.all([amountToWei(provider, tokenA, amountAMin), amountToWei(provider, tokenB, amountBMin)]);

    // Remap tokenAB to token01
    if (token0 === tokenA && token1 === tokenB) {
        return [
            [tokenA, 'A', amountAMinWei],
            [tokenB, 'B', amountBMinWei],
        ];
    } else if (token0 === tokenB && token1 === tokenA) {
        return [
            [tokenB, 'B', amountBMinWei],
            [tokenA, 'A', amountAMinWei],
        ];
    }

    throw new Error(`Invalid token pair: ${tokenA} and ${tokenB}`);
}

async function getPool(chainId: number, provider: PublicClient, tokenA: Address, tokenB: Address): Promise<Address | undefined> {
    try {
        return await provider.readContract({
            address: ADDRESSES[chainId].ALGEBRA_FACTORY_ADDRESS,
            abi: algebraFactoryAbi,
            functionName: 'poolByPair',
            args: [tokenA, tokenB],
        });
    } catch (error) {
        return undefined;
    }
}

async function getCurrentTick(provider: PublicClient, pool: Address) {
    const poolState = await provider.readContract({
        address: pool,
        abi: algebraPoolAbi,
        functionName: 'globalState',
        args: [],
    });

    return BigInt(poolState[1]);
}

async function simulateDecreaseLiquidityAmounts(chainId: number, provider: PublicClient, positionId: bigint, liquidityToRemove: bigint) {
    const decreaseLiquidity = await provider.simulateContract({
        address: ADDRESSES[chainId].NONFUNGIBLE_POSITION_MANAGER_ADDRESS,
        abi: nonFungiblePositionManagerAbi,
        functionName: 'decreaseLiquidity',
        args: [
            {
                tokenId: positionId,
                liquidity: liquidityToRemove,
                amount0Min: 0n,
                amount1Min: 0n,
                deadline: BigInt(Math.floor(Date.now() / 1000) + 60 * 5), // 5 minutes from now
            },
        ],
    });

    return decreaseLiquidity.result;
}

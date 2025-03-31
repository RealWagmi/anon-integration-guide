import { FunctionOptions, FunctionReturn, getChainFromName, toResult, TransactionParams } from '@heyanon/sdk';
import { Address, encodeFunctionData, parseEventLogs, PublicClient } from 'viem';
import { ADDRESSES, DEFAULT_SLIPPAGE, PERCENTAGE_BASE, SUPPORTED_CHAINS, ZERO_ADDRESS } from '../constants';
import { amountToWei, getSymbol, weiToAmount } from '../utils';
import { algebraFactoryAbi, algebraPoolAbi, nonFungiblePositionManagerAbi } from '../abis';
import { queryLPPositions } from './getLPPositions';

interface Props {
    chainName: string;
    account: Address;
    tokenA: Address;
    tokenB: Address;
    amountA: string;
    amountB: string;
    tokenId?: number;
    amountAMin?: string;
    amountBMin?: string;
    slippage?: number;
}

// TODO: If tokenId is not set, display all positions, so user doesn't need to query it again
export async function increaseLiquidity(
    { chainName, account, tokenA, tokenB, amountA, amountB, tokenId, amountAMin, amountBMin, slippage }: Props,
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

    // Validate slippage
    if (slippage && (!Number.isInteger(slippage) || slippage < 0 || slippage > 300)) {
        return toResult(`Invalid slippage tolerance: ${slippage}, please provide a whole non-negative number, max 3% got ${slippage / 100} %`, true);
    }

    await notify(`Preparing to increase liquidity on Camelot V3...`);

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

    // Remap tokenAB to token01
    let [[token0, token0Symbol, amount0Wei, amount0MinWei], [token1, token1Symbol, amount1Wei, amount1MinWei]] = await tokenABToToken01(
        provider,
        positionData[2],
        positionData[3],
        tokenA,
        amountA,
        amountAMin,
        tokenB,
        amountB,
        amountBMin,
    );

    // Simulate increase liquidity amounts if amount0Min and/or amount1Min are not provided
    if (amount0MinWei == 0n || amount1MinWei == 0n) {
        const [simulatedAmount0, simulatedAmount1] = await simulateIncreaseLiquidityAmounts(chainId, provider, positionId, amount0Wei, amount1Wei);
        amount0MinWei = simulatedAmount0;
        amount1MinWei = simulatedAmount1;
    }

    // Set slippage tolerance
    let slippageMultiplier
    if(slippage) {
        slippageMultiplier = PERCENTAGE_BASE - BigInt(slippage);
    } else {
        // Set default 0.2% slippage tolerance
        slippageMultiplier = PERCENTAGE_BASE - DEFAULT_SLIPPAGE;
    }

    amount0MinWei = (amount0MinWei * slippageMultiplier) / PERCENTAGE_BASE;
    amount1MinWei = (amount1MinWei * slippageMultiplier) / PERCENTAGE_BASE;

    // Validate amounts
    const tickLower = positionData[4];
    const tickUpper = positionData[5];

    const pool = await getPool(chainId, provider, token0, token1);
    if (!pool || pool === ZERO_ADDRESS) return toResult(`Pool not found for ${token0} and ${token1}`, true);

    const currentTick = await getCurrentTick(provider, pool!);

    if (currentTick >= tickLower && currentTick <= tickUpper) {
        // Two-sided liquidity position
        if (amount0Wei === 0n) return toResult(`Amount ${token0Symbol} must be greater than 0`, true);

        if (amount1Wei === 0n) return toResult(`Amount ${token1Symbol} must be greater than 0`, true);

        if (amount0MinWei === 0n) return toResult(`Amount ${token0Symbol} MIN must be greater than 0`, true);

        if (amount1MinWei === 0n) return toResult(`Amount ${token1Symbol} MIN must be greater than 0`, true);
    } else if (currentTick < tickLower) {
        // Single-sided liquidity position - token0
        if (amount0Wei === 0n) return toResult(`Amount ${token0Symbol} must be greater than 0`, true);

        if (amount0MinWei === 0n) return toResult(`Amount ${token0Symbol} MIN must be greater than 0`, true);
    } else if (currentTick > tickUpper) {
        // Single-sided liquidity position - token1
        if (amount1Wei === 0n) return toResult(`Amount ${token1Symbol} must be greater than 0`, true);

        if (amount1MinWei === 0n) return toResult(`Amount ${token1Symbol} MIN must be greater than 0`, true);
    }

    const transactions: TransactionParams[] = [];

    // Prepare increase liquidity transaction
    const increaseLiquidityTxData = encodeFunctionData({
        abi: nonFungiblePositionManagerAbi,
        functionName: 'increaseLiquidity',
        args: [
            {
                tokenId: positionId,
                amount0Desired: amount0Wei,
                amount1Desired: amount1Wei,
                amount0Min: amount0MinWei,
                amount1Min: amount1MinWei,
                deadline: BigInt(Math.floor(Date.now() / 1000) + 60 * 5), // 5 minutes from now
            },
        ],
    });

    // Wrap into multicall
    const multicallTx: TransactionParams = {
        target: ADDRESSES[chainId].NONFUNGIBLE_POSITION_MANAGER_ADDRESS,
        data: encodeFunctionData({
            abi: nonFungiblePositionManagerAbi,
            functionName: 'multicall',
            args: [[increaseLiquidityTxData]],
        }),
    };

    transactions.push(multicallTx);

    await notify('Waiting for increase liquidity transaction confirmation...');

    const result = await sendTransactions({ chainId, account, transactions });
    const increaseLiquidity = result.data[result.data.length - 1];

    if (result.isMultisig) {
        return toResult(increaseLiquidity.message);
    }

    if (!increaseLiquidity.hash) {
        return toResult(`Tried to increase liquidity on Camelot V3, but failed to receive tx hash. ${increaseLiquidity.message}`);
    }

    const receipt = await provider.getTransactionReceipt({ hash: increaseLiquidity.hash });

    const increaseLiquidityEvents = parseEventLogs({
        logs: receipt.logs,
        abi: nonFungiblePositionManagerAbi,
        eventName: 'IncreaseLiquidity',
    });

    const increaseLiquidityEvent = increaseLiquidityEvents.find((log) => log.args.tokenId == positionId);
    if (!increaseLiquidityEvent) {
        return toResult(`Increased liquidity on Camelot V3, but couldn't verify amounts. ${JSON.stringify(increaseLiquidity)}`);
    }

    const [symbol0, symbol1, amount0, amount1] = await Promise.all([getSymbol(provider, token0), getSymbol(provider, token1), weiToAmount(provider, token0, increaseLiquidityEvent.args.amount0), weiToAmount(provider, token1, increaseLiquidityEvent.args.amount1)]);

    return toResult(`Successfully increased liquidity [${amount0} ${symbol0}, ${amount1} ${symbol1}] on Camelot V3. ${increaseLiquidity.message}`);
}

async function getPositionData(chainId: number, provider: PublicClient, positionId: bigint) {
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
    amountA: string,
    amountAMin: string | undefined,
    tokenB: Address,
    amountB: string,
    amountBMin: string | undefined,
): Promise<[Address, string, bigint, bigint][]> {
    // Convert amounts to wei
    let [amountAWei, amountAMinWei, amountBWei, amountBMinWei] = await Promise.all([
        amountToWei(provider, tokenA, amountA),
        amountToWei(provider, tokenA, amountAMin),
        amountToWei(provider, tokenB, amountB),
        amountToWei(provider, tokenB, amountBMin),
    ]);

    // Remap tokenAB to token01
    if (token0 === tokenA && token1 === tokenB) {
        return [
            [tokenA, 'A', amountAWei, amountAMinWei],
            [tokenB, 'B', amountBWei, amountBMinWei],
        ];
    } else if (token0 === tokenB && token1 === tokenA) {
        return [
            [tokenB, 'B', amountBWei, amountBMinWei],
            [tokenA, 'A', amountAWei, amountAMinWei],
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

async function simulateIncreaseLiquidityAmounts(chainId: number, provider: PublicClient, positionId: bigint, amount0Desired: bigint, amount1Desired: bigint) {
    const increaseLiquidity = await provider.simulateContract({
        address: ADDRESSES[chainId].NONFUNGIBLE_POSITION_MANAGER_ADDRESS,
        abi: nonFungiblePositionManagerAbi,
        functionName: 'increaseLiquidity',
        args: [
            {
                tokenId: positionId,
                amount0Desired,
                amount1Desired,
                amount0Min: 0n,
                amount1Min: 0n,
                deadline: BigInt(Math.floor(Date.now() / 1000) + 60 * 5), // 5 minutes from now
            },
        ],
    });

    const [, amount0, amount1] = increaseLiquidity.result;
    return [amount0, amount1];
}

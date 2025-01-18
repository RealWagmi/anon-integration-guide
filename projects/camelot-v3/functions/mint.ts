import {
    checkToApprove,
    FunctionOptions,
    FunctionReturn,
    getChainFromName,
    toResult,
    TransactionParams,
} from '@heyanon/sdk';
import { Address, encodeFunctionData, parseUnits, PublicClient } from 'viem';
import { ADDRESSES, MAX_TICK, MIN_TICK, SUPPORTED_CHAINS, ZERO_ADDRESS } from '../constants';
import { amountToWei, convertPriceToTick, convertTickToPrice, getDecimals } from '../utils';
import { algebraFactoryAbi, algebraPoolAbi, nonFungiblePositionManagerAbi } from '../abis';

interface Props {
    chainName: string;
    account: Address;
    tokenA: Address;
    tokenB: Address;
    amountA: string;
    amountB: string;
    amountAMin?: string;
    amountBMin?: string;
    lowerPrice?: string; // Assuming price is calculated as tokenB / tokenA (on DEX price is denominated as token1 / token0)
    upperPrice?: string; // Assuming price is calculated as tokenB / tokenA (on DEX price is denominated as token1 / token0)
    lowerPricePercentage?: number;
    upperPricePercengage?: number;
    recipient?: Address;
}

// TODO: How can we detect if user has input wrong lowerPrice? We can inverse it if necessary (i.e. tokenA != token0)
// TODO: How can we detect if user has input wrong upperPrice? We can inverse it if necessary (i.e. tokenA != token0)
// TODO: How to determine min amount?
// TODO: Need to call refundETH() if adding liquidity with native asset
// TODO:     /// @dev Call this when the pool does exist and is initialized. Note that if the pool is created but not initialized
//     /// a method does not exist, i.e. the pool is assumed to be initialized.
export async function mint(
    { chainName, account, tokenA, tokenB, amountA, amountB, amountAMin, amountBMin, lowerPrice, upperPrice, lowerPricePercentage, upperPricePercengage, recipient }: Props,
    { sendTransactions, notify, getProvider }: FunctionOptions,
): Promise<FunctionReturn> {
    try {
        // Check wallet connection
        if (!account) return toResult('Wallet not connected', true);

        // Validate chain
        const chainId = getChainFromName(chainName);
        if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
        if (!SUPPORTED_CHAINS.includes(chainId)) return toResult(`Camelot V3 is not supported on ${chainName}`, true);

        await notify(`Preparing to add liquidity on Camelot V3...`);

        const provider = getProvider(chainId);

        // Get pool data
        const pool = await getPool(chainId, provider, tokenA, tokenB);
        if (!pool || pool === ZERO_ADDRESS) return toResult(`Pool for pair (${tokenA}, ${tokenB}) not found`, true);

        // Get token0 and token1
        const poolState = await getPoolState(provider, pool);
        if (!poolState) return toResult(`Invalid pool (${pool}), failed to read pool data`, true);

        const [token0, token1, tickSpacing, sqrtPriceX96, currentTick] = poolState;

        // Remap tokenAB to token01
        let [[, token0Symbol, amount0Wei, amount0MinWei], [, token1Symbol, amount1Wei, amount1MinWei]] = await tokenABToToken01(
            provider,
            token0,
            token1,
            tokenA,
            amountA,
            amountAMin,
            tokenB,
            amountB,
            amountBMin,
        );

        // Convert prices to ticks
        const [token0Decimals, token1Decimals] = await Promise.all([getDecimals(provider, token0), getDecimals(provider, token1)]);
        let tickLower = priceToTick(lowerPrice, lowerPricePercentage, token0Decimals, token1Decimals, tickSpacing, currentTick, true);
        let tickUpper = priceToTick(upperPrice, upperPricePercengage, token0Decimals, token1Decimals, tickSpacing, currentTick, false);

        if (tickLower > tickUpper) {
            return toResult('Lower price should be less than upper price.', true);
        }

        // Adjust lower / upper tick when placing limit order at a specific price
        if (tickLower === tickUpper) {
            if (tickLower <= currentTick) {
                tickLower -= 1;
            } else if (tickUpper > currentTick) {
                tickUpper += 1;
            }
        }

        // Simulate mint if amountAMin and/or amountBMin are not provided
        if (amount0MinWei == 0n || amount1MinWei == 0n) {
            const [simulatedAmount0, simulatedAmount1] = await simulateMintAmounts(
                chainId,
                provider,
                token0,
                token1,
                tickLower,
                tickUpper,
                amount0Wei,
                amount1Wei,
                recipient ?? account,
            );

            // Set 0.2% slippage tolerance
            if (amount0MinWei == 0n) {
                amount0MinWei = (simulatedAmount0 * 9998n) / 10000n;
            }

            if (amount1MinWei == 0n) {
                amount1MinWei = (simulatedAmount1 * 9998n) / 10000n;
            }
        }

        // Validate amounts
        if (currentTick >= tickLower && currentTick <= tickUpper) {
            // Two-sided liquidity position
            if (amount0Wei === 0n) return toResult(`Amount ${token0Symbol} must be greater than 0`, true);

            if (amount1Wei === 0n) return toResult(`Amount ${token1Symbol} must be greater than 0`, true);

            // if (amount0MinWei === 0n)
            //     return toResult(`Amount ${token0Symbol} MIN must be greater than 0`, true);
            //
            // if (amount1MinWei === 0n)
            //     return toResult(`Amount ${token1Symbol} MIN must be greater than 0`, true);
        } else if (currentTick < tickLower) {
            // Single-sided liquidity position - token0
            if (amount0Wei === 0n) return toResult(`Amount ${token0Symbol} must be greater than 0`, true);

            // if (amount0MinWei === 0n)
            //     return toResult(`Amount ${token0Symbol} MIN must be greater than 0`, true);
        } else if (currentTick > tickUpper) {
            // Single-sided liquidity position - token1
            if (amount1Wei === 0n) return toResult(`Amount ${token1Symbol} must be greater than 0`, true);

            // if (amount1MinWei === 0n)
            //     return toResult(`Amount ${token1Symbol} MIN must be greater than 0`, true);
        }

        const transactions: TransactionParams[] = [];

        // Check and prepare approve transaction if needed
        await checkToApprove({
            args: {
                account,
                target: token0,
                spender: ADDRESSES[chainId].NONFUNGIBLE_POSITION_MANAGER_ADDRESS,
                amount: amount0Wei,
            },
            provider,
            transactions,
        });

        await checkToApprove({
            args: {
                account,
                target: token1,
                spender: ADDRESSES[chainId].NONFUNGIBLE_POSITION_MANAGER_ADDRESS,
                amount: amount1Wei,
            },
            provider,
            transactions,
        });

        // Prepare mint transaction
        const mintTxData = encodeFunctionData({
            abi: nonFungiblePositionManagerAbi,
            functionName: 'mint',
            args: [
                {
                    token0: token0,
                    token1: token1,
                    tickLower: tickLower,
                    tickUpper: tickUpper,
                    amount0Desired: amount0Wei,
                    amount1Desired: amount1Wei,
                    amount0Min: amount0MinWei,
                    amount1Min: amount1MinWei,
                    recipient: recipient ?? account,
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
                args: [[mintTxData]],
            }),
        };

        transactions.push(multicallTx);

        await notify('Waiting for add liquidity transaction confirmation...');

        const result = await sendTransactions({ chainId, account, transactions });
        const mintMessage = result.data[result.data.length - 1];

        return toResult(result.isMultisig ? mintMessage.message : `Successfully added liquidity on Camelot V3. ${mintMessage.message}`);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return toResult(errorMessage, true);
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

async function getPoolState(provider: PublicClient, pool: Address): Promise<[Address, Address, number, bigint, number] | undefined> {
    try {
        const poolData = await provider.multicall({
            contracts: [
                {
                    address: pool,
                    abi: algebraPoolAbi,
                    functionName: 'token0',
                    args: [],
                },
                {
                    address: pool,
                    abi: algebraPoolAbi,
                    functionName: 'token1',
                    args: [],
                },
                {
                    address: pool,
                    abi: algebraPoolAbi,
                    functionName: 'tickSpacing',
                    args: [],
                },
                {
                    address: pool,
                    abi: algebraPoolAbi,
                    functionName: 'globalState',
                    args: [],
                },
            ],
        });

        const token0 = poolData[0].result!;
        const token1 = poolData[1].result!;
        const tickSpacing = poolData[2].result!;
        const sqrtPriceX96 = poolData[3].result![0];
        const currentTick = poolData[3].result![1];

        return [token0, token1, tickSpacing, sqrtPriceX96, currentTick];
    } catch (error) {
        return undefined;
    }
}

function priceToTick(
    price: string | undefined,
    pricePercentage: number | undefined,
    token0Decimals: number,
    token1Decimals: number,
    tickSpacing: number,
    currentTick: number,
    isLower: boolean,
) {
    let tick: number;
    if (isLower) {
        tick = MIN_TICK;
    } else {
        tick = MAX_TICK;
    }

    if (price) {
        tick = convertPriceToTick(parseUnits(price, token1Decimals), token0Decimals, tickSpacing, isLower);
    } else if (pricePercentage) {
        const currentPrice = convertTickToPrice(currentTick, token0Decimals, token1Decimals);

        let percentageMuliplier: number;
        if (isLower) {
            percentageMuliplier = 100 - pricePercentage;
        } else {
            percentageMuliplier = 100 + pricePercentage;
        }

        const adjustedPrice = (currentPrice * percentageMuliplier) / 100;
        tick = convertPriceToTick(parseUnits(adjustedPrice.toString(), token1Decimals), token0Decimals, tickSpacing, isLower);
    }

    return tick;
}

// TODO: How to implement this, there is no option for tracing, multicall doesn't allow overriding the sender, simulateContract accepts only 1 contract
export async function simulateMintAmounts(
    chainId: number,
    provider: PublicClient,
    token0: Address,
    token1: Address,
    tickLower: number,
    tickUpper: number,
    amount0Wei: bigint,
    amount1Wei: bigint,
    recipient: Address,
): Promise<[bigint, bigint]> {
    // const approveToken0Data = encodeFunctionData({
    //     abi: nonFungiblePositionManagerAbi,
    //     functionName: 'approve',
    //     args: [ADDRESSES[chainId].NONFUNGIBLE_POSITION_MANAGER_ADDRESS, amount0Wei],
    // })
    //
    // const approveToken1Data = encodeFunctionData({
    //     abi: nonFungiblePositionManagerAbi,
    //     functionName: 'approve',
    //     args: [ADDRESSES[chainId].NONFUNGIBLE_POSITION_MANAGER_ADDRESS, amount1Wei],
    // })
    //
    // const mintData = encodeFunctionData({
    //     abi: nonFungiblePositionManagerAbi,
    //     functionName: 'mint',
    //     args: [{
    //         token0: token0,
    //         token1: token1,
    //         tickLower: tickLower,
    //         tickUpper: tickUpper,
    //         amount0Desired: amount0Wei,
    //         amount1Desired: amount1Wei,
    //         amount0Min: 0n,
    //         amount1Min: 0n,
    //         recipient: recipient,
    //         deadline: BigInt(Math.floor(Date.now() / 1000) + 60 * 5), // 5 minutes from now
    //     }],
    // })
    //
    // const multi = await provider.multicall({
    //     contracts: [
    //         {
    //             address: token0,
    //             abi: nonFungiblePositionManagerAbi,
    //             functionName: 'approve',
    //             args: [ADDRESSES[chainId].NONFUNGIBLE_POSITION_MANAGER_ADDRESS, amount0Wei],
    //         },
    //         {
    //             address: token1,
    //             abi: nonFungiblePositionManagerAbi,
    //             functionName: 'approve',
    //             args: [ADDRESSES[chainId].NONFUNGIBLE_POSITION_MANAGER_ADDRESS, amount1Wei],
    //         },
    //         {
    //             address: ADDRESSES[chainId].NONFUNGIBLE_POSITION_MANAGER_ADDRESS,
    //             abi: nonFungiblePositionManagerAbi,
    //             functionName: 'mint',
    //             args: [{
    //                 token0: token0,
    //                 token1: token1,
    //                 tickLower: tickLower,
    //                 tickUpper: tickUpper,
    //                 amount0Desired: amount0Wei,
    //                 amount1Desired: amount1Wei,
    //                 amount0Min: 0n,
    //                 amount1Min: 0n,
    //                 recipient: recipient,
    //                 deadline: BigInt(Math.floor(Date.now() / 1000) + 60 * 5), // 5 minutes from now
    //             }],
    //         }
    // ],
    // })

    return [0n, 0n];
}

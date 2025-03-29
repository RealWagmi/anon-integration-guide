import { type PublicClient, type Account, encodeFunctionData, Address, formatUnits, parseUnits } from 'viem';
import { FunctionReturn, FunctionOptions, toResult } from '@heyanon/sdk';
import { CONTRACT_ADDRESSES, NETWORKS } from '../../../constants.js';
import { VaultPriceFeed } from '../../../abis/VaultPriceFeed.js';
import { PositionRouter } from '../../../abis/PositionRouter.js';
import { ERC20 } from '../../../abis/ERC20.js';
import { getPerpsLiquidity } from './getPerpsLiquidity.js';
import { getUserTokenBalances } from '../../liquidity/getUserTokenBalances.js';

interface Props {
    chainName: (typeof NETWORKS)[keyof typeof NETWORKS];
    account: Address;
    indexToken: Address;
    collateralToken: Address;
    isLong: boolean;
    sizeUsd: string;
    collateralUsd: string;
    referralCode?: Address;
    slippageBps?: number;
}

interface PositionValidation {
    success: boolean;
    error?: string;
    details?: {
        indexTokenPrice: string;
        collateralTokenPrice: string;
        leverage: string;
        requiredCollateralAmount: bigint;
        sizeDelta: bigint;
        allowance: bigint;
        minExecutionFee: bigint;
        indexTokenPriceRaw: bigint;
    };
}

interface TokenBalance {
    symbol: string;
    address: Address;
    decimals: number;
    balance: string;
    balanceUsd: string;
    price: string;
}

interface OpenPositionResponse {
    success: boolean;
    hash: string;
    details: {
        indexToken: Address;
        collateralToken: Address;
        isLong: boolean;
        sizeUsd: string;
        collateralUsd: string;
        leverage: string;
        positionKey?: string;
        collateralDelta?: string;
        sizeDelta?: string;
        price?: string;
        fee?: string;
        warning?: string;
    };
}

async function checkTokenBalance(publicClient: PublicClient, tokenAddress: Address, userAddress: Address, decimals: number = 18): Promise<string> {
    try {
        const balance = await publicClient.readContract({
            address: tokenAddress,
            abi: ERC20,
            functionName: 'balanceOf',
            args: [userAddress],
        });

        return formatUnits(balance, decimals);
    } catch (error) {
        console.error('Error checking token balance:', error);
        return '0';
    }
}

export async function validateOpenPosition(publicClient: PublicClient, params: Props, account: Account): Promise<PositionValidation> {
    try {
        // For S token collateral, we need to use the wrapped token (wS) price as reference
        const priceReferenceToken = params.collateralToken.toLowerCase() === CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN.toLowerCase() 
            ? CONTRACT_ADDRESSES[NETWORKS.SONIC].WRAPPED_NATIVE_TOKEN 
            : params.collateralToken;

        // Get token prices
        const [indexTokenPrice, collateralTokenPrice] = (await Promise.all([
            publicClient.readContract({
                address: CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT_PRICE_FEED as Address,
                abi: VaultPriceFeed,
                functionName: 'getPrice',
                args: [params.indexToken, params.isLong, !params.isLong, true],
            }),
            publicClient.readContract({
                address: CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT_PRICE_FEED as Address,
                abi: VaultPriceFeed,
                functionName: 'getPrice',
                args: [priceReferenceToken, false, true, true],
            }),
        ])) as [bigint, bigint];

        // Format prices as strings with proper decimal places
        const indexTokenPriceStr = formatUnits(indexTokenPrice, 30);
        const collateralTokenPriceStr = formatUnits(collateralTokenPrice, 30);

        console.log('\nPrice Details:');
        console.log('Index Token Price:', indexTokenPriceStr);
        console.log('Collateral Token Price:', collateralTokenPriceStr);

        // Calculate required collateral amount in token decimals
        const sizeUsdBigInt = parseUnits(params.sizeUsd, 30);
        const collateralUsdBigInt = parseUnits(params.collateralUsd, 30);
        const leverage = formatUnits(sizeUsdBigInt * BigInt(1e30) / collateralUsdBigInt, 30);
        
        // Convert collateral USD to token amount
        // Price is in 1e30 decimals, we want the result in 1e18 (token decimals)
        // So we multiply by 1e18 instead of 1e30 to get the correct decimals
        const requiredCollateralAmount = (collateralUsdBigInt * BigInt(1e18)) / collateralTokenPrice;

        // Get minimum execution fee
        const minExecutionFee = await publicClient.readContract({
            address: CONTRACT_ADDRESSES[NETWORKS.SONIC].POSITION_ROUTER as Address,
            abi: PositionRouter,
            functionName: 'minExecutionFee',
        }) as bigint;

        // Check token allowance only for non-native tokens
        let allowance = 0n;
        if (params.collateralToken.toLowerCase() !== CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN.toLowerCase()) {
            allowance = await publicClient.readContract({
                address: params.collateralToken,
                abi: ERC20,
                functionName: 'allowance',
                args: [account.address, CONTRACT_ADDRESSES[NETWORKS.SONIC].ROUTER],
            }) as bigint;
        }

        return {
            success: true,
            details: {
                indexTokenPrice: indexTokenPriceStr,
                collateralTokenPrice: collateralTokenPriceStr,
                leverage,
                requiredCollateralAmount,
                sizeDelta: sizeUsdBigInt,
                allowance,
                minExecutionFee,
                indexTokenPriceRaw: indexTokenPrice,
            },
        };
    } catch (error) {
        console.error('Error validating position:', error);
        return { success: false, error: 'Failed to validate position parameters' };
    }
}

async function checkAlternativeLiquidity(
    publicClient: PublicClient,
    isLong: boolean,
    options: FunctionOptions,
    accountAddress: `0x${string}`,
): Promise<{ token: string; address: `0x${string}`; availableLiquidityUsd: string }[]> {
    // Define available tokens based on position type
    const longTokens = [
        { symbol: 'S', address: CONTRACT_ADDRESSES[NETWORKS.SONIC].WRAPPED_NATIVE_TOKEN },
        { symbol: 'ANON', address: CONTRACT_ADDRESSES[NETWORKS.SONIC].ANON },
        { symbol: 'WETH', address: CONTRACT_ADDRESSES[NETWORKS.SONIC].WETH },
    ];

    const shortTokens = [
        { symbol: 'USDC', address: CONTRACT_ADDRESSES[NETWORKS.SONIC].USDC },
        { symbol: 'EURC', address: CONTRACT_ADDRESSES[NETWORKS.SONIC].EURC },
    ];

    const tokensToCheck = isLong ? longTokens : shortTokens;
    const results = [];

    for (const token of tokensToCheck) {
        const liquidityResult = await getPerpsLiquidity(
            {
                chainName: 'sonic',
                account: accountAddress,
                indexToken: token.address,
                collateralToken: token.address,
                isLong,
            },
            options,
        );

        if (liquidityResult.success) {
            const liquidityInfo = JSON.parse(liquidityResult.data);
            results.push({
                token: token.symbol,
                address: token.address,
                availableLiquidityUsd: liquidityInfo.availableLiquidityUsd,
            });
        }
    }

    // Sort by available liquidity (highest first)
    return results.sort((a, b) => Number(b.availableLiquidityUsd) - Number(a.availableLiquidityUsd));
}

function isPublicClient(client: any): client is PublicClient {
    return client && typeof client === 'object' && 'readContract' in client;
}

export async function openPosition(
    { chainName, account, indexToken, collateralToken, isLong, sizeUsd, collateralUsd, referralCode, slippageBps = 30 }: Props,
    options: FunctionOptions,
): Promise<FunctionReturn> {
    try {
        // Validate chain
        if (chainName !== NETWORKS.SONIC) {
            return toResult('This function is only supported on Sonic chain', true);
        }

        // Check user's token balances first
        const balancesResult = await getUserTokenBalances({
            chainName,
            account
        }, options);

        if (!balancesResult.success) {
            return toResult('Failed to check token balances', true);
        }

        const balances = JSON.parse(balancesResult.data);
        const tokenBalance = balances.tokens.find((token: any) => 
            token.address.toLowerCase() === collateralToken.toLowerCase()
        );

        if (!tokenBalance) {
            return toResult(`Token ${collateralToken} not found in user's balance`, true);
        }

        // Convert collateral USD to token amount for comparison
        const requiredAmount = Number(collateralUsd) / Number(tokenBalance.price);
        const userBalance = Number(tokenBalance.balance);

        if (userBalance < requiredAmount) {
            return toResult(
                `Insufficient balance. Required: ${requiredAmount.toFixed(6)} ${tokenBalance.symbol}, Available: ${userBalance.toFixed(6)} ${tokenBalance.symbol}`,
                true
            );
        }

        // Check available liquidity first
        const liquidityResult = await getPerpsLiquidity(
            {
                chainName,
                account: account as `0x${string}`,
                indexToken,
                collateralToken,
                isLong
            },
            options
        );

        if (!liquidityResult.success) {
            return toResult('Failed to check liquidity', true);
        }

        const liquidityInfo = JSON.parse(liquidityResult.data);
        const availableLiquidityUsd = Number(liquidityInfo.availableLiquidityUsd);
        const requestedSizeUsd = Number(sizeUsd);

        if (availableLiquidityUsd < requestedSizeUsd) {
            return toResult(`Insufficient liquidity. Available: $${availableLiquidityUsd}, Requested: $${requestedSizeUsd}`, true);
        }

        // Validate input values
        const sizeUsdBigInt = parseUnits(sizeUsd, 30);
        const collateralUsdBigInt = parseUnits(collateralUsd, 30);

        if (sizeUsdBigInt <= 0n) {
            return toResult('Position size must be greater than 0', true);
        }

        if (collateralUsdBigInt <= 0n) {
            return toResult('Collateral amount must be greater than 0', true);
        }

        // Calculate and validate leverage
        const leverageBigInt = sizeUsdBigInt * BigInt(1e30) / collateralUsdBigInt;
        const leverageStr = formatUnits(leverageBigInt, 30);
        const leverageNum = Number(leverageStr);

        if (leverageNum < 1.1 || leverageNum > 50) {
            return toResult(`Invalid leverage (${leverageStr}x). Must be between 1.1x and 50x`, true);
        }

        // Get validation details including prices and required amounts
        const validation = await validateOpenPosition(
            options.evm.getProvider(146),
            { chainName, account, indexToken, collateralToken, isLong, sizeUsd, collateralUsd, slippageBps },
            { address: account } as Account
        );

        if (!validation.success || !validation.details) {
            return toResult(validation.error || 'Position validation failed', true);
        }

        // Prepare transactions
        const transactions: { target: Address; data: `0x${string}`; value?: bigint }[] = [];

        // Add approval transaction if needed for non-native tokens
        if (collateralToken.toLowerCase() !== CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN.toLowerCase()) {
            await options.notify('Checking token approval...');
            
            // Check current allowance
            const provider = options.evm.getProvider(146);
            const currentAllowance = await provider.readContract({
                address: collateralToken,
                abi: ERC20,
                functionName: 'allowance',
                args: [account, CONTRACT_ADDRESSES[NETWORKS.SONIC].POSITION_ROUTER],
            }) as bigint;

            await options.notify(`Current allowance: ${formatUnits(currentAllowance, 18)} tokens`);
            await options.notify(`Required allowance: ${formatUnits(validation.details.requiredCollateralAmount, 18)} tokens`);

            // Add approval transaction if needed
            if (currentAllowance < validation.details.requiredCollateralAmount) {
                await options.notify('Insufficient allowance, adding approval transaction...');
                const approvalData = encodeFunctionData({
                    abi: ERC20,
                    functionName: 'approve',
                    args: [
                        CONTRACT_ADDRESSES[NETWORKS.SONIC].POSITION_ROUTER,
                        validation.details.requiredCollateralAmount,
                    ],
                });

                transactions.push({
                    target: collateralToken,
                    data: approvalData,
                    value: 0n,
                });
            } else {
                await options.notify('Token already approved, skipping approval transaction');
            }
        }

        // Prepare position transaction
        const positionPath = [indexToken.toLowerCase() === collateralToken.toLowerCase() ? indexToken : collateralToken];
        const referralBytes32 = referralCode ? 
            `0x${referralCode.slice(2).padEnd(64, '0')}` : 
            `0x${'0'.repeat(64)}`;

        // Use a consistent slippage approach (0.3% for both open and close)
        // For long positions: acceptablePrice = price * (1 + slippage)
        // For short positions: acceptablePrice = price * (1 - slippage)
        const slippageFactor = isLong ? (10000n + BigInt(slippageBps)) : (10000n - BigInt(slippageBps));
        const acceptablePrice = (validation.details.indexTokenPriceRaw * slippageFactor) / 10000n;

        await options.notify(`Creating position with:
            Size: $${sizeUsd}
            Collateral: $${collateralUsd}
            Leverage: ${validation.details.leverage}x
            Price: ${formatUnits(validation.details.indexTokenPriceRaw, 30)}
            Acceptable Price: ${formatUnits(acceptablePrice, 30)}
            Slippage: ${slippageBps} bps
        `);

        const positionData = encodeFunctionData({
            abi: PositionRouter,
            functionName: 'createIncreasePosition',
            args: [
                positionPath,
                indexToken,
                validation.details.requiredCollateralAmount,
                0n,
                validation.details.sizeDelta,
                isLong,
                acceptablePrice,
                validation.details.minExecutionFee,
                referralBytes32 as `0x${string}`,
                '0x0000000000000000000000000000000000000000'
            ],
        });

        const value = collateralToken.toLowerCase() === CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN.toLowerCase()
            ? validation.details.requiredCollateralAmount + validation.details.minExecutionFee
            : validation.details.minExecutionFee;

        transactions.push({
            target: CONTRACT_ADDRESSES[chainName].POSITION_ROUTER as `0x${string}`,
            data: positionData,
            value
        });

        // Send transactions
        await options.notify('Creating position...');
        const result = await options.evm.sendTransactions({
            chainId: 146,
            account: account as `0x${string}`,
            transactions,
        });

        const response: OpenPositionResponse = {
            success: true,
            hash: result.data[0].hash,
            details: {
                indexToken,
                collateralToken,
                isLong,
                sizeUsd,
                collateralUsd,
                leverage: leverageStr,
                price: validation.details.indexTokenPrice,
                fee: formatUnits(validation.details.minExecutionFee, 18)
            }
        };

        return toResult(JSON.stringify(response, null, 2));
    } catch (error) {
        return toResult(`ERROR: Failed to open position: ${error}\n`, true);
    }
}

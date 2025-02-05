import { type PublicClient, type WalletClient, type Account, encodeFunctionData, Address, type Chain, type Client } from 'viem';
import { CONTRACT_ADDRESSES, NETWORKS, CHAIN_CONFIG } from '../../../constants.js';
import { Vault } from '../../../abis/Vault.js';
import { VaultPriceFeed } from '../../../abis/VaultPriceFeed.js';
import { PositionRouter } from '../../../abis/PositionRouter.js';
import { ERC20 } from '../../../abis/ERC20.js';
import { getPerpsLiquidity } from './getPerpsLiquidity.js';
import { getUserTokenBalances } from '../../liquidity/getUserTokenBalances.js';
import { FunctionOptions, FunctionReturn, toResult, TransactionParams, checkToApprove, getChainFromName } from '@heyanon/sdk';
import { Router } from '../../../abis/Router.js';

interface Props {
    chainName: (typeof NETWORKS)[keyof typeof NETWORKS];
    account: Address;
    indexToken: Address;
    collateralToken: Address;
    isLong: boolean;
    sizeUsd: number;
    collateralUsd: number;
    referralCode?: Address;
    slippageBps?: number;
}

interface PositionValidation {
    success: boolean;
    error?: string;
    details?: {
        indexTokenPrice: number;
        collateralTokenPrice: number;
        leverage: number;
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

interface TokenBalanceWithNumber extends Omit<TokenBalance, 'balanceUsd'> {
    balanceUsd: number;
}

async function checkTokenBalance(publicClient: PublicClient, tokenAddress: `0x${string}`, userAddress: `0x${string}`, decimals: number = 18): Promise<number> {
    try {
        const balance = await publicClient.readContract({
            address: tokenAddress,
            abi: ERC20,
            functionName: 'balanceOf',
            args: [userAddress],
        });

        return Number(balance) / Math.pow(10, decimals);
    } catch (error) {
        console.error('Error checking token balance:', error);
        return 0;
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
                address: CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT_PRICE_FEED as `0x${string}`,
                abi: VaultPriceFeed,
                functionName: 'getPrice',
                args: [params.indexToken, params.isLong, !params.isLong, true],
            }),
            publicClient.readContract({
                address: CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT_PRICE_FEED as `0x${string}`,
                abi: VaultPriceFeed,
                functionName: 'getPrice',
                args: [priceReferenceToken, false, true, true],
            }),
        ])) as [bigint, bigint];

        // Convert prices to USD with 30 decimals for display
        const indexTokenPriceUsd = Number(indexTokenPrice) / 1e30;
        const collateralTokenPriceUsd = Number(collateralTokenPrice) / 1e30;

        console.log('\nPrice Details:');
        console.log('Index Token Price:', indexTokenPriceUsd);
        console.log('Collateral Token Price:', collateralTokenPriceUsd);

        // Calculate required collateral amount in token decimals (18 for most tokens)
        const requiredCollateralAmount = BigInt(Math.floor((params.collateralUsd / collateralTokenPriceUsd) * 1e18));

        // Get minimum execution fee
        const minExecutionFee = (await publicClient.readContract({
            address: CONTRACT_ADDRESSES[NETWORKS.SONIC].POSITION_ROUTER as `0x${string}`,
            abi: PositionRouter,
            functionName: 'minExecutionFee',
        })) as bigint;

        // Check token allowance only for non-native tokens
        let allowance = 0n;
        if (params.collateralToken.toLowerCase() !== CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN.toLowerCase()) {
            allowance = (await publicClient.readContract({
                address: params.collateralToken,
                abi: ERC20,
                functionName: 'allowance',
                args: [account.address, CONTRACT_ADDRESSES[NETWORKS.SONIC].ROUTER],
            })) as bigint;
        }

        return {
            success: true,
            details: {
                indexTokenPrice: indexTokenPriceUsd,
                collateralTokenPrice: collateralTokenPriceUsd,
                leverage: params.sizeUsd / params.collateralUsd,
                requiredCollateralAmount,
                sizeDelta: 0n, // This will be calculated in openPosition
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
    { getProvider, notify, sendTransactions }: FunctionOptions,
): Promise<FunctionReturn> {
    try {
        // Validate chain
        const chainId = getChainFromName(chainName);
        if (!chainId) {
            return toResult(`Network ${chainName} not supported`, true);
        }
        if (chainName !== NETWORKS.SONIC) {
            return toResult('This function is only supported on Sonic chain', true);
        }

        // Basic parameter validation
        if (sizeUsd < 11) {
            return toResult('Position size must be at least $11 to cover minimum execution fees', true);
        }

        if (collateralUsd < 10) {
            return toResult('Collateral amount must be at least $10 to maintain position health', true);
        }

        const leverage = sizeUsd / collateralUsd;
        if (leverage < 1.1) {
            return toResult('Leverage must be at least 1.1x to open a position', true);
        }

        // Get and validate provider
        const client = getProvider(chainId);
        if (!isPublicClient(client)) {
            return toResult('Invalid provider: missing required methods', true);
        }

        await notify('Validating position parameters...');

        // Validate position parameters early to get required amounts
        const validation = await validateOpenPosition(
            client,
            { chainName, account, indexToken, collateralToken, isLong, sizeUsd, collateralUsd, referralCode, slippageBps },
            { address: account } as Account,
        );

        if (!validation.success || !validation.details) {
            return toResult(validation.error || 'Position validation failed', true);
        }

        await notify(`Checking balance for ${collateralUsd} USD worth of collateral...`);

        // Check user's token balance
        const balanceResult = await getUserTokenBalances({ chainName, account }, { getProvider, notify, sendTransactions });

        if (!balanceResult.success) {
            return toResult(`Failed to verify token balances: ${balanceResult.data}`, true);
        }

        const balanceData = JSON.parse(balanceResult.data);
        const collateralTokenBalance = balanceData.tokens.find((t: any) => t.address.toLowerCase() === collateralToken.toLowerCase());

        if (!collateralTokenBalance) {
            return toResult(`Failed to find balance for collateral token`, true);
        }

        await notify('\nBalance Check:');
        await notify(`Token: ${collateralTokenBalance.symbol}`);
        await notify(`Raw Balance: ${collateralTokenBalance.balance}`);
        await notify(`USD Value: $${collateralTokenBalance.balanceUsd}`);
        await notify(`Required: $${collateralUsd}`);

        // If insufficient balance, find alternative collateral token
        if (Number(collateralTokenBalance.balanceUsd) < collateralUsd) {
            await notify('\nInsufficient balance in requested collateral token. Checking alternatives...');

            // Sort tokens by USD balance
            const availableTokens = balanceData.tokens
                .map(
                    (t: TokenBalance): TokenBalanceWithNumber => ({
                        ...t,
                        balanceUsd: Number(t.balanceUsd),
                    }),
                )
                .filter((t: TokenBalanceWithNumber) => t.balanceUsd >= collateralUsd)
                .sort((a: TokenBalanceWithNumber, b: TokenBalanceWithNumber) => b.balanceUsd - a.balanceUsd);

            if (availableTokens.length === 0) {
                const balances = balanceData.tokens
                    .map((t: TokenBalance) => `${t.symbol}: $${Number(t.balanceUsd).toFixed(2)}`)
                    .join('\n');
                return toResult(`Insufficient balance in all tokens. Required: $${collateralUsd}.\nAvailable balances:\n${balances}`, true);
            }

            // Use the token with highest balance as collateral
            const bestToken = availableTokens[0];
            await notify(`\nFound better collateral token: ${bestToken.symbol} (Balance: $${bestToken.balanceUsd.toFixed(2)})`);

            // Recursively call openPosition with the new collateral token
            return openPosition(
                {
                    chainName,
                    account,
                    indexToken,
                    collateralToken: bestToken.address,
                    isLong,
                    sizeUsd,
                    collateralUsd,
                    referralCode,
                    slippageBps,
                },
                { getProvider, notify, sendTransactions },
            );
        }

        // Check liquidity using getPerpsLiquidity
        const liquidityResult = await getPerpsLiquidity(
            {
                chainName,
                account,
                indexToken,
                collateralToken,
                isLong,
            },
            { getProvider, notify, sendTransactions },
        );

        if (!liquidityResult.success) {
            return toResult(liquidityResult.data, true);
        }

        const liquidityInfo = JSON.parse(liquidityResult.data);

        await notify('\nLiquidity Check:');
        await notify(`Available Liquidity: $${liquidityInfo.availableLiquidityUsd}`);
        await notify(`Required Size: $${sizeUsd}`);
        await notify(`Max Leverage: ${liquidityInfo.maxLeverage}x`);

        // If position size exceeds available liquidity, check alternatives
        if (sizeUsd > Number(liquidityInfo.availableLiquidityUsd)) {
            const alternatives = await checkAlternativeLiquidity(client, isLong, { getProvider, notify, sendTransactions }, account);
            const viableAlternatives = alternatives.filter((alt) => Number(alt.availableLiquidityUsd) >= sizeUsd && alt.address.toLowerCase() !== indexToken.toLowerCase());

            if (viableAlternatives.length > 0) {
                return toResult(
                    JSON.stringify({
                        error: `Position size $${sizeUsd} exceeds available liquidity $${liquidityInfo.availableLiquidityUsd}`,
                        alternatives: viableAlternatives,
                    }),
                    true,
                );
            }

            return toResult(
                `Position size $${sizeUsd} exceeds available liquidity $${liquidityInfo.availableLiquidityUsd}. No alternative tokens have sufficient liquidity.`,
                true,
            );
        }

        // Validate leverage against max leverage
        if (leverage > liquidityInfo.maxLeverage) {
            return toResult(`Leverage ${leverage.toFixed(2)}x exceeds maximum allowed ${liquidityInfo.maxLeverage}x`, true);
        }

        // Check if position router is approved as plugin and approve if needed
        await notify('Checking plugin approval status...');
        const routerAddress = CONTRACT_ADDRESSES[NETWORKS.SONIC].ROUTER;
        const positionRouterAddress = CONTRACT_ADDRESSES[NETWORKS.SONIC].POSITION_ROUTER;
        
        const isPluginApproved = await client.readContract({
            address: routerAddress,
            abi: Router,
            functionName: 'approvedPlugins',
            args: [account, positionRouterAddress],
        });

        if (!isPluginApproved) {
            await notify('Approving position router plugin...');
            const approvalTx: TransactionParams = {
                target: routerAddress,
                value: 0n,
                data: encodeFunctionData({
                    abi: Router,
                    functionName: 'approvePlugin',
                    args: [positionRouterAddress],
                }),
            };

            try {
                const approvalResult = await sendTransactions({
                    chainId,
                    account,
                    transactions: [approvalTx],
                });
                await notify('Plugin approval successful!');
            } catch (approvalError) {
                console.error('Plugin approval error:', approvalError);
                return toResult('Failed to approve position router plugin', true);
            }
        }

        // Check token approval if not using native token
        if (collateralToken.toLowerCase() !== CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN.toLowerCase()) {
            await notify('Checking token approval...');
            const currentAllowance = await client.readContract({
                address: collateralToken,
                abi: ERC20,
                functionName: 'allowance',
                args: [account, routerAddress],
            });

            if (currentAllowance < validation.details.requiredCollateralAmount) {
                await notify('Approving token spending...');
                const tokenApprovalTx: TransactionParams = {
                    target: collateralToken,
                    value: 0n,
                    data: encodeFunctionData({
                        abi: ERC20,
                        functionName: 'approve',
                        args: [routerAddress, validation.details.requiredCollateralAmount],
                    }),
                };

                try {
                    const tokenApprovalResult = await sendTransactions({
                        chainId,
                        account,
                        transactions: [tokenApprovalTx],
                    });
                    await notify('Token approval successful!');
                } catch (tokenApprovalError) {
                    console.error('Token approval error:', tokenApprovalError);
                    return toResult('Failed to approve token spending', true);
                }
            }
        } else {
            await notify('Using native token (S) - no approval needed');
        }

        // Calculate sizeDelta in USD terms with 30 decimals
        const positionSizeUsd = collateralUsd * (sizeUsd / collateralUsd); // collateral * leverage
        const sizeDelta = BigInt(Math.floor(positionSizeUsd * 1e30));

        // Calculate acceptable price with same decimals as keeper (30)
        const acceptablePrice = isLong
            ? (validation.details.indexTokenPriceRaw * BigInt(10000 + slippageBps)) / BigInt(10000)
            : (validation.details.indexTokenPriceRaw * BigInt(10000 - slippageBps)) / BigInt(10000);

        await notify('\nTransaction Parameters:');
        await notify(`Collateral Amount: ${validation.details.requiredCollateralAmount.toString()}`);
        await notify(`Position Size USD: ${positionSizeUsd}`);
        await notify(`Leverage: ${leverage}x`);
        await notify(`Size Delta (30d USD): ${sizeDelta.toString()}`);
        await notify(`Price (30d): ${validation.details.indexTokenPriceRaw.toString()}`);
        await notify(`Acceptable Price (30d): ${acceptablePrice.toString()}`);
        await notify(`Execution Fee: ${validation.details.minExecutionFee.toString()}`);

        // Prepare transaction data
        const txData: TransactionParams = {
            target: CONTRACT_ADDRESSES[NETWORKS.SONIC].POSITION_ROUTER,
            value:
                validation.details.minExecutionFee +
                (collateralToken.toLowerCase() === CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN.toLowerCase() ? validation.details.requiredCollateralAmount : 0n),
            data: encodeFunctionData({
                abi: PositionRouter,
                functionName:
                    collateralToken.toLowerCase() === CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN.toLowerCase() ? 'createIncreasePositionETH' : 'createIncreasePosition',
                args:
                    collateralToken.toLowerCase() === CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN.toLowerCase()
                        ? [
                              CONTRACT_ADDRESSES[NETWORKS.SONIC].WRAPPED_NATIVE_TOKEN.toLowerCase() === indexToken.toLowerCase()
                                  ? [CONTRACT_ADDRESSES[NETWORKS.SONIC].WRAPPED_NATIVE_TOKEN]
                                  : [CONTRACT_ADDRESSES[NETWORKS.SONIC].WRAPPED_NATIVE_TOKEN, indexToken],
                              indexToken,
                              0n, // minOut
                              sizeDelta,
                              isLong,
                              acceptablePrice,
                              validation.details.minExecutionFee,
                              referralCode || '0x0000000000000000000000000000000000000000000000000000000000000000',
                              '0x0000000000000000000000000000000000000000',
                          ]
                        : [
                              // For regular ERC20 positions
                              collateralToken.toLowerCase() === indexToken.toLowerCase()
                                  ? [collateralToken] // Same token - use it once
                                  : [collateralToken, indexToken], // Different tokens - specify the path
                              indexToken,
                              validation.details.requiredCollateralAmount, // amountIn is the collateral amount for ERC20
                              0n, // minOut
                              sizeDelta,
                              isLong,
                              acceptablePrice,
                              validation.details.minExecutionFee,
                              referralCode || '0x0000000000000000000000000000000000000000000000000000000000000000',
                              '0x0000000000000000000000000000000000000000',
                          ],
            }),
        };

        try {
            await notify('Sending transaction to open position...');
            const txResult = await sendTransactions({
                chainId,
                account,
                transactions: [txData],
            });

            await notify('Transaction sent successfully!');
            return toResult(
                JSON.stringify({
                    success: true,
                    hash: txResult.data[0].hash,
                    details: {
                        positionType: isLong ? 'Long' : 'Short',
                        positionSizeUsd,
                        leverage,
                        sizeDelta: sizeDelta.toString(),
                        acceptablePrice: acceptablePrice.toString(),
                    },
                }),
            );
        } catch (txError) {
            console.error('Transaction error:', txError);
            if (txError instanceof Error) {
                if (txError.message.includes('insufficient funds')) {
                    return toResult('Insufficient funds to cover position and execution fee', true);
                }
                if (txError.message.includes('exceeds allowance')) {
                    return toResult('Token approval failed or was denied', true);
                }
                return toResult(`Transaction failed: ${txError.message}`, true);
            }
            return toResult('Transaction failed. Please check your parameters and try again.', true);
        }
    } catch (error) {
        console.error('Error in openPosition:', error);
        return toResult(error instanceof Error ? error.message : 'Unknown error occurred', true);
    }
}

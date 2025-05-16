import { type PublicClient, type Account, encodeFunctionData, Address, formatUnits, parseUnits } from 'viem';
import { FunctionReturn, FunctionOptions, toResult, TransactionParams } from '@heyanon/sdk';
import { CONTRACT_ADDRESSES, NETWORKS } from '../../../constants.js';
import { VaultPriceFeed } from '../../../abis/VaultPriceFeed.js';
import { PositionRouter } from '../../../abis/PositionRouter.js';
import { ERC20 } from '../../../abis/ERC20.js';
import { getPerpsLiquidity } from './getPerpsLiquidity.js';
import { getUserTokenBalances } from '../../liquidity/getUserTokenBalances.js';
import { type TokenSymbol, getTokenAddress, getTokenDecimals, getSupportedTokens } from '../../../utils.js';
import { getChainFromName } from '../../../utils.js';

interface Props {
    chainName: (typeof NETWORKS)[keyof typeof NETWORKS];
    account: Address;
    indexToken: TokenSymbol;
    collateralToken: TokenSymbol;
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
        indexToken: TokenSymbol;
        collateralToken: TokenSymbol;
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

export async function validateOpenPosition(
    publicClient: PublicClient,
    params: Props,
    userAccountAddress: Address
): Promise<PositionValidation> {
    const { chainName, indexToken: indexTokenSymbol, collateralToken: collateralTokenSymbol, isLong } = params;
    const networkName = chainName.toLowerCase();
    const networkContracts = CONTRACT_ADDRESSES[networkName];

    if (!networkContracts || !networkContracts.VAULT_PRICE_FEED || !networkContracts.POSITION_ROUTER || !networkContracts.ROUTER) {
        return { success: false, error: `Core contract addresses not found for network: ${networkName}` };
    }

    let indexTokenAddress: Address;
    let collateralTokenAddress: Address;
    let collateralTokenDecimals: number;

    try {
        indexTokenAddress = getTokenAddress(indexTokenSymbol, networkName);
        collateralTokenAddress = getTokenAddress(collateralTokenSymbol, networkName);
        collateralTokenDecimals = getTokenDecimals(collateralTokenSymbol, networkName);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return { success: false, error: `Failed to resolve token addresses or decimals: ${errorMessage}` };
    }

    try {
        const priceReferenceTokenAddress = collateralTokenSymbol === (networkName === 'sonic' ? 'S' : 'ETH')
            ? getTokenAddress(networkName === 'sonic' ? 'WS' : 'WETH', networkName)
            : collateralTokenAddress;

        const [indexTokenPrice, collateralTokenPrice] = (await Promise.all([
            publicClient.readContract({
                address: networkContracts.VAULT_PRICE_FEED as Address,
                abi: VaultPriceFeed,
                functionName: 'getPrice',
                args: [indexTokenAddress, isLong, !isLong, true],
            }),
            publicClient.readContract({
                address: networkContracts.VAULT_PRICE_FEED as Address,
                abi: VaultPriceFeed,
                functionName: 'getPrice',
                args: [priceReferenceTokenAddress, false, true, true],
            }),
        ])) as [bigint, bigint];

        const indexTokenPriceStr = formatUnits(indexTokenPrice, 30);
        const collateralTokenPriceStr = formatUnits(collateralTokenPrice, 30);

        console.log('\nPrice Details on', networkName);
        console.log(`Index Token (${indexTokenSymbol}) Price:`, indexTokenPriceStr);
        console.log(`Collateral Token (${collateralTokenSymbol}) Price:`, collateralTokenPriceStr);

        const sizeUsdBigInt = parseUnits(params.sizeUsd, 30);
        const collateralUsdBigInt = parseUnits(params.collateralUsd, 30);
        const leverage = formatUnits(sizeUsdBigInt * BigInt(1e30) / collateralUsdBigInt, 30);
        
        const requiredCollateralAmount = (collateralUsdBigInt * BigInt(10 ** collateralTokenDecimals)) / collateralTokenPrice;

        const minExecutionFee = await publicClient.readContract({
            address: networkContracts.POSITION_ROUTER as Address,
            abi: PositionRouter,
            functionName: 'minExecutionFee',
        }) as bigint;

        let allowance = 0n;
        const nativeSymbolForChain = networkName === 'sonic' ? 'S' : 'ETH';
        if (collateralTokenSymbol !== nativeSymbolForChain) {
            allowance = await publicClient.readContract({
                address: collateralTokenAddress,
                abi: ERC20,
                functionName: 'allowance',
                args: [userAccountAddress, networkContracts.ROUTER],
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
        return { success: false, error: `Failed to validate position parameters on ${networkName}` };
    }
}

async function checkAlternativeLiquidity(
    publicClient: PublicClient,
    chainName: (typeof NETWORKS)[keyof typeof NETWORKS],
    isLong: boolean,
    options: FunctionOptions,
    accountAddress: `0x${string}`,
): Promise<{ token: TokenSymbol; address: Address; availableLiquidityUsd: string }[]> {
    const networkName = chainName.toLowerCase();
    const supportedTokens = getSupportedTokens(networkName);

    if (!supportedTokens.length) {
        console.warn(`No supported tokens found for ${networkName} in checkAlternativeLiquidity`);
        return [];
    }

    const tradablePerpSymbols: TokenSymbol[] = networkName === 'sonic' 
        ? (isLong ? ['S', 'ANON', 'WETH', 'STS'] : ['USDC', 'scUSD']) 
        : (isLong ? ['ETH', 'WETH', 'CBBTC'] : ['USDC']);

    const tokensToCheck = supportedTokens.filter(t => tradablePerpSymbols.includes(t.symbol));
    
    const results: { token: TokenSymbol; address: Address; availableLiquidityUsd: string }[] = [];

    for (const token of tokensToCheck) {
        try {
            const liquidityResult = await getPerpsLiquidity(
                {
                    chainName: chainName,
                    account: accountAddress,
                    indexToken: token.symbol,
                    isLong,
                },
                options,
            );

            if (liquidityResult.success) {
                const liquidityInfo = JSON.parse(liquidityResult.data);
                results.push({
                    token: token.symbol,
                    address: token.address,
                    availableLiquidityUsd: liquidityInfo.info.availableLiquidityUsd,
                });
            }
        } catch (e) {
            console.warn(`Failed to get liquidity for ${token.symbol} on ${networkName}:`, e)
        }
    }
    return results.sort((a, b) => Number(b.availableLiquidityUsd) - Number(a.availableLiquidityUsd));
}

function isPublicClient(client: any): client is PublicClient {
    return client && typeof client === 'object' && 'readContract' in client;
}

export async function openPosition(
    { chainName, account, indexToken, collateralToken, isLong, sizeUsd, collateralUsd, referralCode, slippageBps = 30 }: Props,
    options: FunctionOptions,
): Promise<FunctionReturn> {
    const networkName = chainName.toLowerCase() as 'sonic' | 'base';
    const networkContracts = CONTRACT_ADDRESSES[networkName];

    if (!networkContracts || !networkContracts.POSITION_ROUTER) {
        return toResult(`PositionRouter address not found for network: ${networkName}`, true);
    }
    const positionRouterAddress = networkContracts.POSITION_ROUTER as Address;

    let indexTokenAddress: Address;
    let collateralTokenAddress: Address;
    let nativeSymbol: TokenSymbol;
    let wrappedNativeAddress: Address;

    try {
        indexTokenAddress = getTokenAddress(indexToken, networkName);
        collateralTokenAddress = getTokenAddress(collateralToken, networkName);
        nativeSymbol = networkName === 'sonic' ? 'S' : 'ETH';
        wrappedNativeAddress = getTokenAddress(networkName === 'sonic' ? 'WS' : 'WETH', networkName);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return toResult(`Failed to resolve token addresses or decimals: ${errorMessage}`, true);
    }

    const chainId = getChainFromName(networkName.toUpperCase() as 'SONIC' | 'BASE');
    if (!chainId) {
        return toResult(`Unsupported chain: ${networkName}`, true);
    }
    const publicClient = options.getProvider(chainId) as PublicClient;
    if (!publicClient || !isPublicClient(publicClient)) {
        return toResult('Public client is not initialized correctly from options.getProvider.', true);
    }
    
    const userAccountAddress = account;
    const validateProps: Props = { chainName, account: userAccountAddress, indexToken, collateralToken, isLong, sizeUsd, collateralUsd, referralCode, slippageBps };

    const validation = await validateOpenPosition(publicClient, validateProps, userAccountAddress);
    if (!validation.success || !validation.details) {
        return toResult(validation.error || 'Position validation failed.', true);
    }

    const { requiredCollateralAmount, sizeDelta, minExecutionFee, indexTokenPriceRaw } = validation.details;
    
    const amountIn = requiredCollateralAmount;
    const basisPointsDivisor = BigInt(10000); // 10000 BPS = 100%
    const slippageBigInt = BigInt(slippageBps); // Ensure slippageBps is BigInt for calculation
    const slippageAmountOffset = (indexTokenPriceRaw * slippageBigInt) / basisPointsDivisor;

    let finalAcceptablePrice: bigint;
    if (isLong) {
        // For a long, _acceptablePrice is the MAX price we are willing to buy at.
        // So, we add the slippage amount to the raw price.
        finalAcceptablePrice = indexTokenPriceRaw + slippageAmountOffset;
    } else {
        // For a short, _acceptablePrice is the MIN price we are willing to sell at.
        // So, we subtract the slippage amount from the raw price.
        finalAcceptablePrice = indexTokenPriceRaw - slippageAmountOffset;
    }
    const acceptablePrice = finalAcceptablePrice;

    let data: `0x${string}`;
    let value: bigint | undefined = undefined;

    const referralCodeBytes32 = "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`;

    const callbackTargetAddress = "0x0000000000000000000000000000000000000000" as Address;
    const minOut = BigInt(0);

    if (collateralToken === nativeSymbol) {
        const ethPath: readonly Address[] = [wrappedNativeAddress, indexTokenAddress];
        const args = [
            ethPath,
            indexTokenAddress,
            minOut,
            sizeDelta,
            isLong,
            acceptablePrice,
            minExecutionFee,
            referralCodeBytes32,
            callbackTargetAddress
        ] as const;
        console.log("Calling PositionRouter.createIncreasePositionETH with args:", args, "and value:", amountIn + minExecutionFee);
        try {
            data = encodeFunctionData({
                abi: PositionRouter,
                functionName: 'createIncreasePositionETH',
                args: args,
            });
            value = amountIn + minExecutionFee;
        } catch (error) {
            console.error("Error encoding createIncreasePositionETH:", error);
            return toResult(`Error encoding createIncreasePositionETH: ${(error as Error).message}`, true);
        }
    } else {
        const erc20Path: readonly Address[] = [collateralTokenAddress, indexTokenAddress];
        const args = [
            erc20Path,
            indexTokenAddress,
            amountIn,
            minOut,
            sizeDelta,
            isLong,
            acceptablePrice,
            minExecutionFee,
            referralCodeBytes32,
            callbackTargetAddress
        ] as const;
        console.log("Calling PositionRouter.createIncreasePosition with args:", args);
        try {
            data = encodeFunctionData({
                abi: PositionRouter,
                functionName: 'createIncreasePosition',
                args: args
            });
            value = minExecutionFee;
        } catch (error) {
            console.error("Error encoding createIncreasePosition:", error);
            return toResult(`Error encoding createIncreasePosition: ${(error as Error).message}`, true);
        }
    }

    const tx: TransactionParams = {
        target: positionRouterAddress,
        data,
        value,
    };

    return toResult(tx);
}

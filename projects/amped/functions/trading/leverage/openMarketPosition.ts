import { ethers } from 'ethers';
import { Vault } from '../../../abis/Vault.js';
import { PositionRouter } from '../../../abis/PositionRouter.js';
import { Router } from '../../../abis/Router.js';
import { CONTRACT_ADDRESSES, NETWORKS } from '../../../constants.js';
import { getLeverageLiquidity } from './getLiquidity.js';
import { ERC20 } from '../../../abis/ERC20.js';
import { VaultPriceFeed } from '../../../abis/VaultPriceFeed.js';

export interface OpenPositionParams {
  signer: ethers.Signer;
  indexToken: string;
  collateralToken: string;
  isLong: boolean;
  sizeDelta: ethers.BigNumber;
  collateralAmount: ethers.BigNumber;
  leverage: number;
  acceptablePrice?: ethers.BigNumber;
  minOut?: ethers.BigNumber;
  executionFee?: ethers.BigNumber;
  referralCode?: string;
  collateralDecimals?: number;  // Add decimals for collateral token
}

async function checkLiquidity(
  signer: ethers.Signer,
  indexToken: string,
  collateralToken: string,
  isLong: boolean,
  requiredSize: ethers.BigNumber
): Promise<void> {
  const provider = signer.provider!;
  const vault = new ethers.Contract(
    CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT,
    Vault,
    provider
  );
  
  const poolAmount = await vault.poolAmounts(indexToken);
  const reservedAmount = await vault.reservedAmounts(indexToken);
  const availableLiquidity = poolAmount.sub(reservedAmount);

  // Convert requiredSize from 30 decimals to 18 for comparison
  const requiredSize18 = requiredSize.div(ethers.BigNumber.from(10).pow(12));

  if (availableLiquidity.lt(requiredSize18)) {
    throw new Error(`Insufficient liquidity. Available: ${ethers.utils.formatEther(availableLiquidity)} tokens, Required: ${ethers.utils.formatEther(requiredSize18)} tokens`);
  }
}

async function approvePlugin(signer: ethers.Signer): Promise<boolean> {
  const router = new ethers.Contract(
    CONTRACT_ADDRESSES[NETWORKS.SONIC].ROUTER,
    Router,
    signer
  );

  const account = await signer.getAddress();
  const positionRouterAddress = CONTRACT_ADDRESSES[NETWORKS.SONIC].POSITION_ROUTER;
  
  const isApproved = await router.approvedPlugins(account, positionRouterAddress);
  if (!isApproved) {
    console.log('Approving PositionRouter plugin...');
    const tx = await router.approvePlugin(positionRouterAddress);
    await tx.wait();
    console.log('PositionRouter plugin approved');
    return true;
  }
  return isApproved;
}

async function approveToken(
  signer: ethers.Signer,
  tokenAddress: string,
  spenderAddress: string,
  amount: ethers.BigNumber
): Promise<void> {
  const token = new ethers.Contract(tokenAddress, ERC20, signer);
  const account = await signer.getAddress();
  
  const allowance = await token.allowance(account, spenderAddress);
  if (allowance.lt(amount)) {
    console.log('Approving token...');
    const tx = await token.approve(spenderAddress, ethers.constants.MaxUint256);
    await tx.wait();
    console.log('Token approved');
  }
}

async function checkTokenLiquidity(
  provider: ethers.providers.Provider,
  token: string,
  requiredAmount: number
): Promise<{
  hasLiquidity: boolean;
  availableLiquidityTokens: string;
  availableLiquidityUsd: number;
  tokenPriceUsd: number;
}> {
  const vault = new ethers.Contract(
    CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT,
    Vault,
    provider
  );
  
  const priceFeed = new ethers.Contract(
    CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT_PRICE_FEED,
    VaultPriceFeed,
    provider
  );

  const poolAmount = await vault.poolAmounts(token);
  const reservedAmount = await vault.reservedAmounts(token);
  const availableLiquidity = poolAmount.sub(reservedAmount);
  const tokenPrice = await priceFeed.getPrice(token, false, true, true);
  const tokenPriceUsd = Number(ethers.utils.formatUnits(tokenPrice, 30));
  
  const availableLiquidityTokens = ethers.utils.formatUnits(availableLiquidity, 18);
  const availableLiquidityUsd = Number(availableLiquidityTokens) * tokenPriceUsd;
  
  return {
    hasLiquidity: availableLiquidityUsd >= requiredAmount,
    availableLiquidityTokens,
    availableLiquidityUsd,
    tokenPriceUsd
  };
}

async function findTokenWithLiquidity(
  provider: ethers.providers.Provider,
  requiredAmount: number
): Promise<{
  token: string;
  symbol: string;
  liquidity: {
    availableLiquidityTokens: string;
    availableLiquidityUsd: number;
    tokenPriceUsd: number;
  };
} | null> {
  // List of possible tokens to trade
  const tokens = [
    {
      address: CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN,
      symbol: 'S'
    },
    {
      address: CONTRACT_ADDRESSES[NETWORKS.SONIC].ANON,
      symbol: 'ANON'
    },
    {
      address: CONTRACT_ADDRESSES[NETWORKS.SONIC].WETH,
      symbol: 'WETH'
    }
  ];

  console.log('\nChecking available liquidity across tokens:');
  
  for (const token of tokens) {
    const liquidity = await checkTokenLiquidity(provider, token.address, requiredAmount);
    console.log(`${token.symbol}:
    Available Liquidity: ${liquidity.availableLiquidityTokens} ${token.symbol}
    Liquidity Value: $${liquidity.availableLiquidityUsd.toFixed(2)} USD
    Price: $${liquidity.tokenPriceUsd.toFixed(2)} USD`);

    if (liquidity.hasLiquidity) {
      return {
        token: token.address,
        symbol: token.symbol,
        liquidity
      };
    }
  }

  return null;
}

export async function openMarketPosition({
  signer,
  indexToken,
  collateralToken,
  isLong,
  sizeDelta,
  collateralAmount,
  leverage,
  acceptablePrice,
  minOut = ethers.BigNumber.from(0),
  executionFee = ethers.utils.parseEther('0.001'),
  referralCode = '',
  collateralDecimals
}: OpenPositionParams): Promise<ethers.ContractTransaction> {
  // 1. Check liquidity
  await checkLiquidity(signer, indexToken, collateralToken, isLong, sizeDelta);

  // 2. Approve PositionRouter plugin
  const pluginApproved = await approvePlugin(signer);
  if (!pluginApproved) {
    throw new Error('PositionRouter plugin approval failed');
  }

  // 3. Approve token spending if using a token other than native token
  if (collateralToken !== CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN) {
    const positionRouterAddress = CONTRACT_ADDRESSES[NETWORKS.SONIC].POSITION_ROUTER;
    await approveToken(signer, collateralToken, positionRouterAddress, collateralAmount);
  }

  // 4. If no acceptable price provided, get current price and add buffer
  let finalAcceptablePrice: ethers.BigNumber;
  if (acceptablePrice) {
    finalAcceptablePrice = acceptablePrice;
  } else {
    const provider = signer.provider!;
    const priceFeed = new ethers.Contract(
      CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT_PRICE_FEED,
      VaultPriceFeed,
      provider
    );
    const currentPrice = await priceFeed.getPrice(indexToken, false, true, true);
    if (!currentPrice) {
      throw new Error('Failed to get current price');
    }
    finalAcceptablePrice = isLong
      ? currentPrice.mul(101).div(100)  // 1% higher for longs
      : currentPrice.mul(99).div(100);  // 1% lower for shorts
  }

  const positionRouter = new ethers.Contract(
    CONTRACT_ADDRESSES[NETWORKS.SONIC].POSITION_ROUTER,
    PositionRouter,
    signer
  );
  
  const path = collateralToken === indexToken ? [collateralToken] : [collateralToken, indexToken];
  const formattedReferralCode = ethers.utils.formatBytes32String(referralCode);

  console.log('Opening position with parameters:');
  console.log('- Size Delta:', ethers.utils.formatUnits(sizeDelta, 30));
  console.log('- Collateral:', ethers.utils.formatUnits(collateralAmount, collateralDecimals || 18));
  console.log('- Leverage:', leverage);
  console.log('- Acceptable Price:', ethers.utils.formatUnits(finalAcceptablePrice, 30));
  console.log('- Execution Fee:', ethers.utils.formatEther(executionFee));
  console.log('- Is Long:', isLong);

  try {
    let tx;
    if (collateralToken === CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN) {
      // Use createIncreasePositionETH for native token
      tx = await positionRouter.createIncreasePositionETH(
        path,                // _path: single token if same, otherwise route from collateral to index
        indexToken,          // _indexToken
        minOut,              // _minOut (in token's native decimals)
        sizeDelta,           // _sizeDelta (in 30 decimals)
        Boolean(isLong),     // _isLong
        finalAcceptablePrice,// _acceptablePrice (in 30 decimals for price feed)
        executionFee,        // _executionFee (in 18 decimals)
        formattedReferralCode, // _referralCode
        ethers.constants.AddressZero, // _callbackTarget
        { 
          value: collateralAmount.add(executionFee),  // For native token, send both collateral and fee
          gasLimit: 600000
        }
      );
    } else {
      // Use createIncreasePosition for ERC20 tokens
      tx = await positionRouter.createIncreasePosition(
        path,                // _path: single token if same, otherwise route from collateral to index
        indexToken,          // _indexToken
        collateralAmount,    // _amountIn (in token's native decimals)
        minOut,              // _minOut (in token's native decimals)
        sizeDelta,           // _sizeDelta (in 30 decimals)
        Boolean(isLong),     // _isLong
        finalAcceptablePrice,// _acceptablePrice (in 30 decimals for price feed)
        executionFee,        // _executionFee (in 18 decimals)
        formattedReferralCode, // _referralCode
        ethers.constants.AddressZero, // _callbackTarget
        { 
          value: executionFee,  // For ERC20 tokens, only send fee
          gasLimit: 600000
        }
      );
    }

    console.log('Position open request submitted');
    console.log('Transaction hash:', tx.hash);
    return tx;
  } catch (error) {
    console.error('Error opening position:', error);
    throw error;
  }
}

export interface OpenLongParams {
  signer: ethers.Signer;
  indexToken: string;
  usdAmount: number;
  leverage: number;
}

export async function openLongPosition({
  signer,
  indexToken,
  usdAmount,
  leverage
}: OpenLongParams): Promise<ethers.ContractTransaction> {
  const provider = signer.provider!;
  const priceFeed = new ethers.Contract(
    CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT_PRICE_FEED,
    VaultPriceFeed,
    provider
  );

  // Get current prices
  const indexPrice = await priceFeed.getPrice(indexToken, false, true, true);
  const indexPriceInUsd = ethers.utils.formatUnits(indexPrice, 30);
  console.log(`Current Index Token Price: $${indexPriceInUsd}`);

  const sPrice = await priceFeed.getPrice(CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN, false, true, true);
  const sPriceInUsd = ethers.utils.formatUnits(sPrice, 30);
  console.log(`Current S Price: $${sPriceInUsd}`);

  // Calculate position parameters
  const sizeDelta = ethers.utils.parseUnits((usdAmount * leverage / Number(indexPriceInUsd)).toString(), 30);
  
  // Calculate collateral amount in S tokens with 2% buffer for slippage
  const baseCollateralAmount = ethers.utils.parseEther((usdAmount / Number(sPriceInUsd)).toString());
  const collateralAmount = baseCollateralAmount.mul(102).div(100);

  // Check native token balance
  const balance = await provider.getBalance(await signer.getAddress());
  if (balance.lt(collateralAmount.add(ethers.utils.parseEther('0.001')))) {
    throw new Error(`Insufficient balance for collateral: Required ${ethers.utils.formatEther(collateralAmount.add(ethers.utils.parseEther('0.001')))} S, Available ${ethers.utils.formatEther(balance)} S`);
  }

  return openMarketPosition({
    signer,
    indexToken,
    collateralToken: CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN,
    isLong: true,
    sizeDelta,
    collateralAmount,
    leverage
  });
}

export interface OpenPositionWithValueParams {
  signer: ethers.Signer;
  indexToken: string;  // Token to long
  collateralToken: string;  // Token to use as collateral
  collateralValueUsd: number;  // USD value of collateral (minimum $10)
  positionValueUsd: number;  // USD value of the position to open
}

interface CollateralBalance {
  token: string;
  symbol: string;
  balance: ethers.BigNumber;
  balanceFormatted: string;
  balanceUsd: number;
  decimals: number;
}

async function checkCollateralOptions(
  signer: ethers.Signer,
  requiredUsd: number
): Promise<CollateralBalance | null> {
  const provider = signer.provider!;
  const userAddress = await signer.getAddress();
  const priceFeed = new ethers.Contract(
    CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT_PRICE_FEED,
    VaultPriceFeed,
    provider
  );

  // List of possible collateral tokens
  const collateralTokens = [
    {
      address: CONTRACT_ADDRESSES[NETWORKS.SONIC].USDC,
      name: 'USDC.e'
    },
    {
      address: CONTRACT_ADDRESSES[NETWORKS.SONIC].WETH,
      name: 'WETH'
    },
    {
      address: CONTRACT_ADDRESSES[NETWORKS.SONIC].ANON,
      name: 'ANON'
    }
  ];

  console.log('\nChecking available collateral options:');

  // Check native token (S) balance first
  const nativeBalance = await provider.getBalance(userAddress);
  const nativePrice = await priceFeed.getPrice(CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN, false, true, true);
  const nativePriceUsd = Number(ethers.utils.formatUnits(nativePrice, 30));
  const nativeBalanceFormatted = ethers.utils.formatEther(nativeBalance);
  const nativeBalanceUsd = Number(nativeBalanceFormatted) * nativePriceUsd;

  console.log(`S (native token):
    Balance: ${nativeBalanceFormatted} S
    Price: $${nativePriceUsd.toFixed(2)}
    Value: $${nativeBalanceUsd.toFixed(2)}`);

  if (nativeBalanceUsd >= requiredUsd) {
    return {
      token: CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN,
      symbol: 'S',
      balance: nativeBalance,
      balanceFormatted: nativeBalanceFormatted,
      balanceUsd: nativeBalanceUsd,
      decimals: 18
    };
  }

  // Check other tokens
  for (const token of collateralTokens) {
    try {
      const tokenContract = new ethers.Contract(token.address, ERC20, provider);
      const decimals = await tokenContract.decimals();
      const balance = await tokenContract.balanceOf(userAddress);
      const price = await priceFeed.getPrice(token.address, false, true, true);
      const priceUsd = Number(ethers.utils.formatUnits(price, 30));
      const balanceFormatted = ethers.utils.formatUnits(balance, decimals);
      const balanceUsd = Number(balanceFormatted) * priceUsd;

      console.log(`${token.name}:
    Balance: ${balanceFormatted} ${token.name}
    Price: $${priceUsd.toFixed(2)}
    Value: $${balanceUsd.toFixed(2)}`);

      if (balanceUsd >= requiredUsd) {
        return {
          token: token.address,
          symbol: token.name,
          balance,
          balanceFormatted,
          balanceUsd,
          decimals
        };
      }
    } catch (error) {
      console.log(`Error checking ${token.name}:`, error);
    }
  }

  return null;
}

export async function openLongPositionWithValue({
  signer,
  indexToken,
  collateralToken,
  collateralValueUsd,
  positionValueUsd,
}: OpenPositionWithValueParams): Promise<ethers.ContractTransaction> {
  // Validate minimum collateral
  if (collateralValueUsd < 10) {
    throw new Error('Minimum collateral value is $10 USD');
  }

  // Validate minimum position size
  if (positionValueUsd < 11) {
    throw new Error('Minimum position value is $11 USD (1.1x leverage on $10 minimum collateral)');
  }

  // Calculate leverage based on position size and collateral
  const leverage = positionValueUsd / collateralValueUsd;
  if (leverage > 11) {
    throw new Error('Maximum leverage is 11x');
  }
  if (leverage < 1.1) {
    throw new Error('Minimum leverage is 1.1x');
  }

  const provider = signer.provider!;

  // Check liquidity for requested token first
  console.log(`\nChecking liquidity for requested token...`);
  const initialLiquidity = await checkTokenLiquidity(provider, indexToken, positionValueUsd);
  
  if (!initialLiquidity.hasLiquidity) {
    console.log(`\nInsufficient liquidity for requested token.
Available: ${initialLiquidity.availableLiquidityTokens} tokens ($${initialLiquidity.availableLiquidityUsd.toFixed(2)} USD)
Required: $${positionValueUsd.toFixed(2)} USD`);
    
    // Try to find another token with sufficient liquidity
    const alternativeToken = await findTokenWithLiquidity(provider, positionValueUsd);
    
    if (alternativeToken) {
      throw new Error(
        `Insufficient liquidity for requested token. ` +
        `Consider using ${alternativeToken.symbol} instead, which has $${alternativeToken.liquidity.availableLiquidityUsd.toFixed(2)} available liquidity.`
      );
    } else {
      throw new Error(
        `Insufficient liquidity for requested token and no alternative tokens found with sufficient liquidity. ` +
        `Required: $${positionValueUsd.toFixed(2)} USD`
      );
    }
  }

  // Find best collateral option
  const bestCollateral = await checkCollateralOptions(signer, collateralValueUsd);
  if (!bestCollateral) {
    throw new Error(
      `Insufficient balance in any supported collateral token. ` +
      `Required: $${collateralValueUsd.toFixed(2)} USD`
    );
  }

  console.log(`\nSelected collateral: ${bestCollateral.symbol}
    Amount: ${bestCollateral.balanceFormatted} ${bestCollateral.symbol}
    Value: $${bestCollateral.balanceUsd.toFixed(2)} USD`);

  // Use the best collateral token instead of the requested one
  collateralToken = bestCollateral.token;

  const priceFeed = new ethers.Contract(
    CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT_PRICE_FEED,
    VaultPriceFeed,
    provider
  );

  // Get current prices
  const indexPrice = await priceFeed.getPrice(indexToken, false, true, true);
  const indexPriceInUsd = ethers.utils.formatUnits(indexPrice, 30);
  console.log(`\nCurrent Index Token Price: $${indexPriceInUsd}`);

  const collateralPrice = await priceFeed.getPrice(collateralToken, false, true, true);
  const collateralPriceInUsd = ethers.utils.formatUnits(collateralPrice, 30);
  console.log(`Current Collateral Token Price: $${collateralPriceInUsd}`);

  // Calculate token amounts based on decimals
  const sizeDelta = ethers.utils.parseUnits(
    (positionValueUsd / Number(indexPriceInUsd)).toString(),
    30  // Use 30 decimals for sizeDelta as expected by the contract
  );

  const collateralAmount = ethers.utils.parseUnits(
    (collateralValueUsd / Number(collateralPriceInUsd)).toString(),
    bestCollateral.decimals  // Use token's native decimals
  );

  // If using a token (not native S), check approval
  if (collateralToken !== CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN) {
    const tokenContract = new ethers.Contract(collateralToken, ERC20, provider);
    const userAddress = await signer.getAddress();
    const allowance = await tokenContract.allowance(userAddress, CONTRACT_ADDRESSES[NETWORKS.SONIC].POSITION_ROUTER);
    if (allowance.lt(collateralAmount)) {
      console.log('Approving token spend...');
      const approveTx = await tokenContract.connect(signer).approve(
        CONTRACT_ADDRESSES[NETWORKS.SONIC].POSITION_ROUTER,
        ethers.constants.MaxUint256 // Infinite approval
      );
      await approveTx.wait();
      console.log('Token spend approved');
    }
  }

  // Open the position
  return openMarketPosition({
    signer,
    indexToken,
    collateralToken,
    isLong: true,
    sizeDelta,
    collateralAmount,
    leverage: Math.round(leverage * 100) / 100,  // Round to 2 decimal places
    collateralDecimals: bestCollateral.decimals
  });
} 

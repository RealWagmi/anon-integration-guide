import { ethers } from 'ethers';
import { Vault } from '../../../abis/Vault';
import { PositionRouter } from '../../../abis/PositionRouter';
import { Router } from '../../../abis/Router';
import { CONTRACT_ADDRESSES, NETWORKS } from '../../../constants';
import { getLeverageLiquidity, LeverageLiquidityResult } from './getLiquidity';
import { ERC20 } from '../../../abis/ERC20.js';
import { VaultPriceFeed } from '../../../abis/VaultPriceFeed.js';

export interface MarketPositionParams {
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
}

export interface PositionDetails {
  size: ethers.BigNumber;
  collateral: ethers.BigNumber;
  averagePrice: ethers.BigNumber;
  fundingRate: ethers.BigNumber;
  hasProfit: boolean;
  unrealizedPnl: ethers.BigNumber;
  lastUpdated: ethers.BigNumber;
}

export interface OpenLeveragedPositionParams {
  signer: ethers.Signer;
  indexToken: string;
  collateralToken: string;
  isLong: boolean;
  sizeDelta: ethers.BigNumber;
  collateralAmount: ethers.BigNumber;
  leverage: number;
}

export interface TokenLiquidity {
  symbol: string;
  address: string;
  price: number;
  availableLiquidity: ethers.BigNumber;
  availableLiquidityUsd: number;
}

async function checkLiquidity(
  signer: ethers.Signer,
  indexToken: string,
  collateralToken: string,
  isLong: boolean,
  requiredSize: ethers.BigNumber
): Promise<LeverageLiquidityResult> {
  const provider = signer.provider!;
  const network = NETWORKS.SONIC;
  
  const vault = new ethers.Contract(CONTRACT_ADDRESSES[network].VAULT, Vault, provider);
  
  // Get pool and reserved amounts directly
  const poolAmount = await vault.poolAmounts(indexToken);
  const reservedAmount = await vault.reservedAmounts(indexToken);
  const availableLiquidity = poolAmount.sub(reservedAmount);

  if (availableLiquidity.lt(requiredSize)) {
    throw new Error(`Insufficient liquidity. Available: ${ethers.utils.formatUnits(availableLiquidity, 18)} S, Required: ${ethers.utils.formatUnits(requiredSize, 18)} S`);
  }

  return {
    maxLeverage: isLong ? 11 : 10,
    maxPositionSize: ethers.constants.MaxUint256,
    maxCollateral: ethers.constants.MaxUint256,
    poolAmount,
    reservedAmount,
    availableLiquidity,
    fundingRate: ethers.BigNumber.from(0)
  };
}

async function approvePlugin(signer: ethers.Signer): Promise<boolean> {
  const network = NETWORKS.SONIC;
  const router = new ethers.Contract(
    CONTRACT_ADDRESSES[network].ROUTER,
    Router,
    signer
  );

  const account = await signer.getAddress();
  const positionRouterAddress = CONTRACT_ADDRESSES[network].POSITION_ROUTER;
  
  const isApproved = await router.approvedPlugins(account, positionRouterAddress);
  if (!isApproved) {
    console.log('Approving PositionRouter plugin...');
    const tx = await router.approvePlugin(positionRouterAddress, {
      gasLimit: 100000
    });
    await tx.wait();
    console.log('PositionRouter plugin approved');
    return true;
  }
  return isApproved;
}

async function isLeverageEnabled(signer: ethers.Signer): Promise<boolean> {
  const isApproved = await approvePlugin(signer);
  if (!isApproved) {
    console.log('Leverage trading is not enabled. Please approve the PositionRouter plugin first.');
    return false;
  }
  return true;
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
  } else {
    console.log('Token already approved');
  }
}

export async function getPositionDetails(
  signer: ethers.Signer,
  indexToken: string,
  collateralToken: string,
  isLong: boolean
): Promise<PositionDetails> {
  const network = NETWORKS.SONIC;
  const vault = new ethers.Contract(
    CONTRACT_ADDRESSES[network].VAULT,
    Vault,
    signer
  );

  const account = await signer.getAddress();
  const position = await vault.getPosition(account, collateralToken, indexToken, isLong);

  return {
    size: position[0],
    collateral: position[1],
    averagePrice: position[2],
    fundingRate: position[3],
    hasProfit: position[4],
    unrealizedPnl: position[5],
    lastUpdated: position[6]
  };
}

export async function openLeveragedPosition(
  params: OpenLeveragedPositionParams
): Promise<MarketPositionResult> {
  const { signer, indexToken, collateralToken, isLong, sizeDelta, collateralAmount, leverage } = params;
  const network = NETWORKS.SONIC;
  
  // 1. Check available liquidity
  const liquidity = await checkLiquidity(signer, indexToken, collateralToken, isLong, sizeDelta);
  
  // 2. Verify plugin approval
  await approvePlugin(signer);

  // 3. Get current price and calculate acceptable price (1% slippage)
  const vault = new ethers.Contract(CONTRACT_ADDRESSES[network].VAULT, Vault, signer);
  const currentPrice = await vault.getMaxPrice(indexToken);
  const acceptablePrice = isLong 
    ? currentPrice.mul(101).div(100)  // 1% higher for long
    : currentPrice.mul(99).div(100);  // 1% lower for short

  // 4. Calculate execution parameters
  const executionFee = ethers.utils.parseEther('0.001');
  const totalValue = collateralAmount.add(executionFee);
  const path = [collateralToken]; // Single token path since we're not swapping

  // 5. Execute position
  return marketPosition({
    signer,
    indexToken,
    collateralToken,
    isLong,
    sizeDelta,
    collateralAmount,
    leverage,
    acceptablePrice,
    minOut: collateralAmount.mul(99).div(100), // 1% slippage
    executionFee,
    referralCode: ethers.utils.formatBytes32String('')
  });
}

export interface MarketPositionResult {
  positionId: string;
  transactionHash: string;
}

export async function marketPosition(params: MarketPositionParams) {
  const {
    signer,
    indexToken,
    collateralToken,
    isLong,
    sizeDelta,
    collateralAmount,
    acceptablePrice,
    minOut = ethers.BigNumber.from(0),
    executionFee = ethers.utils.parseEther('0.001'),
    referralCode = ''
  } = params;

  // 1. Check if leverage is enabled
  const leverageEnabled = await isLeverageEnabled(signer);
  if (!leverageEnabled) {
    throw new Error('Leverage trading is not enabled. Please approve the PositionRouter plugin first.');
  }

  // 2. Check liquidity
  await checkLiquidity(signer, indexToken, collateralToken, isLong, sizeDelta);

  // 3. Approve token spending if using a token other than native token
  if (collateralToken !== CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN) {
    const positionRouterAddress = CONTRACT_ADDRESSES[NETWORKS.SONIC].POSITION_ROUTER;
    await approveToken(signer, collateralToken, positionRouterAddress, collateralAmount);
  }

  const positionRouter = new ethers.Contract(CONTRACT_ADDRESSES[NETWORKS.SONIC].POSITION_ROUTER, PositionRouter, signer);
  
  // Calculate value based on token type
  const value = collateralToken === CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN
    ? collateralAmount.add(executionFee)  // For native token, send both collateral and fee
    : executionFee;                       // For other tokens, only send fee

  const path = [collateralToken];
  const formattedReferralCode = ethers.utils.formatBytes32String(referralCode);

  const tx = await positionRouter.createIncreasePosition(
    path,                // _path
    indexToken,          // _indexToken
    collateralAmount,    // _amountIn
    sizeDelta,           // _sizeDelta
    isLong,              // _isLong
    acceptablePrice,     // _acceptablePrice
    minOut,              // _minOut
    executionFee,        // _executionFee
    formattedReferralCode, // _referralCode
    { value }  // transaction overrides
  );

  return tx;
}

export async function checkTokenLiquidity(
  provider: ethers.providers.Provider,
  tokenAddress: string,
  tokenSymbol: string
): Promise<TokenLiquidity | null> {
  try {
    const priceFeed = new ethers.Contract(
      CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT_PRICE_FEED,
      VaultPriceFeed,
      provider
    );
    const tokenContract = new ethers.Contract(tokenAddress, ERC20, provider);
    const vault = CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT;

    const price = await priceFeed.getPrice(tokenAddress, false, true, true);
    const priceInUsd = parseFloat(ethers.utils.formatUnits(price, 30));
    
    const poolAmount = await tokenContract.balanceOf(vault);
    const reservedAmount = ethers.BigNumber.from(0); // For simplicity
    const availableLiquidity = poolAmount.sub(reservedAmount);

    console.log(`\n${tokenSymbol} Liquidity Info:`);
    console.log(`- Price: $${priceInUsd}`);
    console.log(`- Pool Amount: ${ethers.utils.formatEther(poolAmount)} ${tokenSymbol}`);
    console.log(`- Reserved Amount: ${ethers.utils.formatEther(reservedAmount)} ${tokenSymbol}`);
    console.log(`- Available Liquidity: ${ethers.utils.formatEther(availableLiquidity)} ${tokenSymbol}`);
    console.log(`- Available Liquidity in USD: $${parseFloat(ethers.utils.formatEther(availableLiquidity)) * priceInUsd}`);

    return {
      symbol: tokenSymbol,
      address: tokenAddress,
      price: priceInUsd,
      availableLiquidity,
      availableLiquidityUsd: parseFloat(ethers.utils.formatEther(availableLiquidity)) * priceInUsd
    };
  } catch (error) {
    console.error(`Error checking ${tokenSymbol} liquidity:`, error);
    return null;
  }
}

export interface OpenLongPositionParams {
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
}: OpenLongPositionParams): Promise<ethers.ContractTransaction> {
  const provider = signer.provider as ethers.providers.Provider;
  const priceFeed = new ethers.Contract(
    CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT_PRICE_FEED,
    VaultPriceFeed,
    provider
  );
  const positionRouter = new ethers.Contract(
    CONTRACT_ADDRESSES[NETWORKS.SONIC].POSITION_ROUTER,
    PositionRouter,
    signer
  );

  // Get current prices
  const indexPrice = await priceFeed.getPrice(indexToken, false, true, true);
  const indexPriceInUsd = ethers.utils.formatUnits(indexPrice, 30);
  console.log(`Current Index Token Price: $${indexPriceInUsd}`);

  const sPrice = await priceFeed.getPrice(CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN, false, true, true);
  const sPriceInUsd = ethers.utils.formatUnits(sPrice, 30);
  console.log(`Current S Price: $${sPriceInUsd}`);

  // Set up position parameters
  const executionFee = ethers.utils.parseEther('0.001');

  // Calculate collateral amount in S tokens with 2% buffer for slippage
  const baseCollateralAmount = ethers.utils.parseEther((usdAmount / Number(sPriceInUsd)).toString());
  const collateralAmount = baseCollateralAmount.mul(102).div(100);
  
  // Calculate size delta with 30 decimals to match price feed precision
  const sizeDelta = ethers.utils.parseUnits((usdAmount * leverage / Number(indexPriceInUsd)).toString(), 30);

  // Check native token balance
  const balance = await provider.getBalance(await signer.getAddress());
  console.log(`Native token balance: ${ethers.utils.formatEther(balance)} S`);

  if (balance.lt(collateralAmount.add(executionFee))) {
    throw new Error(`Insufficient balance for collateral: Required ${ethers.utils.formatEther(collateralAmount.add(executionFee))} S, Available ${ethers.utils.formatEther(balance)} S`);
  }

  console.log(`Opening ${leverage}x long position:`);
  console.log(`Collateral USD Value: $${usdAmount}`);
  console.log(`Collateral: ${ethers.utils.formatEther(collateralAmount)} S`);
  console.log(`Position size: ${ethers.utils.formatUnits(sizeDelta, 30)} tokens`);
  console.log(`Position value: $${usdAmount * leverage}`);
  console.log(`Execution fee: ${ethers.utils.formatEther(executionFee)} S`);
  console.log(`Total value needed: ${ethers.utils.formatEther(collateralAmount.add(executionFee))} S`);

  // Create increase position
  const path = [CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN];
  const minOut = ethers.BigNumber.from(0); // From sample tx
  
  // For a long position, we set acceptable price higher than current price
  // Use 1% buffer for longs (101% of current price)
  const acceptablePrice = ethers.BigNumber.from(indexPrice).mul(101).div(100); // 1% higher
  
  const referralCode = ethers.utils.formatBytes32String('');
  const callbackTarget = ethers.constants.AddressZero;

  console.log('Transaction parameters:');
  console.log('- Path:', path);
  console.log('- Index token:', indexToken);
  console.log('- Min out:', minOut.toString());
  console.log('- Size delta:', ethers.utils.formatUnits(sizeDelta, 30), 'tokens');
  console.log('- Is long:', true);
  console.log('- Acceptable price:', ethers.utils.formatUnits(acceptablePrice, 30));
  console.log('- Execution fee:', ethers.utils.formatEther(executionFee), 'S');
  console.log('- Total value:', ethers.utils.formatEther(collateralAmount.add(executionFee)), 'S');

  return positionRouter.createIncreasePositionETH(
    path,
    indexToken,
    minOut,
    sizeDelta,
    true,
    acceptablePrice,
    executionFee,
    referralCode,
    callbackTarget,
    { 
      value: collateralAmount.add(executionFee),
      gasLimit: 600000,
      type: 0
    }
  );
} 
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, NETWORKS } from '../../../constants.js';
import { PositionRouter } from '../../../abis/PositionRouter.js';
import { Router } from '../../../abis/Router.js';
import { Vault } from '../../../abis/Vault.js';
import { VaultPriceFeed } from '../../../abis/VaultPriceFeed.js';

export interface ClosePositionParams {
  signer: ethers.Signer;
  indexToken: string;
  collateralToken: string;
  isLong: boolean;
  sizeDelta?: ethers.BigNumber;  // Optional - if not provided, closes entire position
  acceptablePrice?: ethers.BigNumber;
  executionFee?: ethers.BigNumber;
  withdrawETH?: boolean;  // Whether to withdraw in ETH (native token) or keep as wrapped
}

export async function closeMarketPosition({
  signer,
  indexToken,
  collateralToken,
  isLong,
  sizeDelta,
  acceptablePrice,
  executionFee = ethers.utils.parseEther('0.001'),
  withdrawETH = true
}: ClosePositionParams): Promise<ethers.ContractTransaction> {
  const provider = signer.provider!;
  const account = await signer.getAddress();
  const positionRouter = new ethers.Contract(
    CONTRACT_ADDRESSES[NETWORKS.SONIC].POSITION_ROUTER,
    PositionRouter,
    signer
  );

  // If sizeDelta not provided, get current position size to close entire position
  let positionSize = sizeDelta;
  if (!positionSize) {
    const vault = new ethers.Contract(
      CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT,
      Vault,
      provider
    );
    const position = await vault.getPosition(
      account,
      collateralToken,
      indexToken,
      isLong
    );
    positionSize = position[0]; // position[0] is the size
  }

  if (!positionSize || positionSize.eq(0)) {
    throw new Error('No position size specified or position not found');
  }

  // For closing positions:
  // - Long positions: acceptablePrice should be lower than current price (willing to sell lower)
  // - Short positions: acceptablePrice should be higher than current price (willing to buy higher)
  let closePrice: ethers.BigNumber;
  if (acceptablePrice) {
    closePrice = acceptablePrice;
  } else {
    // Get current price and add/subtract 1% based on position type
    const priceFeed = new ethers.Contract(
      CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT_PRICE_FEED,
      VaultPriceFeed,
      provider
    );
    const currentPrice = await priceFeed.getPrice(indexToken, false, true, true);
    if (!currentPrice) {
      throw new Error('Failed to get current price');
    }
    closePrice = isLong
      ? currentPrice.mul(99).div(100)  // 99% of current price for longs
      : currentPrice.mul(101).div(100); // 101% of current price for shorts
  }

  const path = [collateralToken];

  try {
    console.log('Closing position with parameters:');
    console.log('- Size Delta:', ethers.utils.formatUnits(positionSize, 30));
    console.log('- Acceptable Price:', ethers.utils.formatUnits(closePrice, 30));
    console.log('- Execution Fee:', ethers.utils.formatEther(executionFee));
    console.log('- Is Long:', isLong);

    // The contract expects (from successful transaction):
    // createDecreasePosition(
    //   address[] _path,
    //   address _indexToken,
    //   uint256 _collateralDelta,
    //   uint256 _sizeDelta,
    //   bool _isLong,
    //   address _receiver,
    //   uint256 _acceptablePrice,
    //   uint256 _minOut,
    //   uint256 _executionFee,
    //   bool _withdrawETH,
    //   address _callbackTarget
    // )
    const tx = await positionRouter.createDecreasePosition(
      path,                // _path
      indexToken,          // _indexToken
      0,                   // _collateralDelta (0 to withdraw all collateral)
      positionSize,        // _sizeDelta
      isLong,              // _isLong
      account,             // _receiver
      closePrice,          // _acceptablePrice
      0,                   // _minOut (0 since we're closing)
      executionFee,        // _executionFee
      withdrawETH,         // _withdrawETH
      ethers.constants.AddressZero, // _callbackTarget (no callback needed)
      {
        value: executionFee,
        gasLimit: 600000  // Using similar gas limit to successful tx
      }
    );

    console.log('Position close request submitted');
    console.log('Transaction hash:', tx.hash);
    return tx;
  } catch (error) {
    console.error('Error closing position:', error);
    throw error;
  }
} 

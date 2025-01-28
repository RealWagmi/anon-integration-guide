// Get the current position size
const position = await vault.getPosition(account.address, ANON_TOKEN_ADDRESS, ANON_TOKEN_ADDRESS, true);
console.log("Current position:", {
    size: ethers.utils.formatUnits(position.size, 30),
    collateral: ethers.utils.formatUnits(position.collateral, 18),
    averagePrice: ethers.utils.formatUnits(position.averagePrice, 30),
    entryFundingRate: position.entryFundingRate,
    reserveAmount: ethers.utils.formatUnits(position.reserveAmount, 18),
    realisedPnl: ethers.utils.formatUnits(position.realisedPnl, 30),
    hasProfit: position.hasProfit,
    lastIncreasedTime: position.lastIncreasedTime.toString()
});

// Close a small portion of the position that's within liquidity limits
const sizeDelta = ethers.utils.parseUnits('0.001', 30); // Close 0.001 tokens worth 
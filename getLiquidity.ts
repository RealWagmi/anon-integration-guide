// Add price feed integration
const priceFeedAddress = await vault.priceFeed();
const priceFeed = new ethers.Contract(priceFeedAddress, PriceFeedAbi, provider);
const price = await priceFeed.getPrice(indexToken, false, true, true);

// Calculate USD value of available liquidity
const availableUSD = availableAmount.mul(price).div(ethers.utils.parseUnits("1", 30));
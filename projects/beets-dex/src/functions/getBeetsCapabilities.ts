import { FunctionReturn, toResult } from '@heyanon/sdk';

/**
 * Returns information about Beets DEX capabilities and example prompts.
 *
 * @returns {Promise<FunctionReturn>} Description of Beets DEX functionality with examples
 */
export async function getBeetsCapabilities(): Promise<FunctionReturn> {
    return toResult(
        `Beets DEX is a decentralized exchange that allows you to swap tokens and earn yield on Sonic Chain, leveraging Balancer's revolutionary architecture for capital-efficient trading.

Here's what you can do on Beets DEX:

1. FIND BEST YIELDS
   - "Best yields on USDC on @beets-dex"
   - "I have stS and USDC, where can I get the best APR on @beets-dex?"
   - "Show pools with ETH on @beets-dex"
   - "Give me info on pool with ID 0x43026d483f42fb35efe03c20b251142d022783f2"

2. MANAGE LIQUIDITY
   - "Add 100 USDC liquidity to Boosted Stable Rings on @beets-dex"
   - "Add 100 USDC and 50 scUSD liquidity to Boosted Stable Rings on @beets-dex"
   - "Add 1 stS liquidity to Staked Sonic Symphony on @beets-dex"
   - "Remove half of my liquidity from Staked Sonic Symphony on @beets-dex"
   - "Remove all liquidity from Fresh Beets on @beets-dex"

3. CHECK YOUR PORTFOLIO
   - "My TVL on @beets-dex"
   - "Show all my positions on @beets-dex"
   - "Value of my USDC-SONIC liquidity on @beets-dex"
   - "Show APR of all my positions on @beets-dex"

4. SWAP TOKENS
   - "Swap 100 USDC for SONIC on @beets-dex"
   - "Swap 100 USDC for SONIC with 0.1% slippage on @beets-dex" 
   - "Swap half of my USDC for SONIC on @beets-dex"
   - "Swap USDC to get exactly 1 SONIC on @beets-dex"

5. CHECK EXCHANGE RATES
   - "How much ETH can I get for 1000 USDC on @beets-dex?"
   - "How much USDC do I need to buy 1 ETH on @beets-dex?"
   - "USDC-SONIC exchange rate on @beets-dex"

Just ask your question in natural language and I'll help you interact with Beets DEX!`,
    );
}

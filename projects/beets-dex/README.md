# Beets DEX - Swap efficiently on Sonic

Beets DEX allows you to swap instantly hundreds of tokens, leveraging Sonic Chain ultrafast transaction speed and Balancer revolutionary architecture.

## Supported Networks

- SONIC

## Common Tasks

- **Liquidity management**
    - Add 100 USDC liquidity to Boosted Stable Rings on @beets-dex
    - Add 100 USDC and 50 scUSD liquidity to Boosted Stable Rings on @beets-dex
    - Add 1 stS liquidity to Staked Sonic Symphony on @beets-dex
    - Remove half of my liquidity from Staked Sonic Symphony on @beets-dex
    - Remove all liquidity from Fresh Beets on @beets-dex
- **Yields & Pools**
    - Best yields on USDC on @beets-dex
    - I have stS and USDC, where can I get the best APR on @beets-dex?
    - Show pools with ETH on @beets-dex
    - Give me info on pool with ID 0x43026d483f42fb35efe03c20b251142d022783f2 on @beets-dex
- **Swap**
    - Swap 100 USDC for SONIC on @beets-dex
    - Swap 100 USDC for SONIC with 0.1% slippage on @beets-dex
    - Swap half of my USDC for SONIC on @beets-dex
    - Swap USDC to get exactly 1 SONIC on @beets-dex
- **Exchange rate**
    - How much ETH can I get for 1000 USDC on @beets-dex?
    - How much USDC do I need to buy 1 ETH on @beets-dex?
    - USDC-SONIC Exchange rate on @beets-dex
- **Portfolio**
    - My TVL on @beets-dex
    - Show all my positions on @beets-dex
    - Value of my USDC-SONIC liquidity on @beets-dex
    - Show APR of all my positions on @beets-dex
- **Alerts**
    - Buy 1000 USDC of SONIC when it dips below 0.4 USDC on @beets-dex
    - Sell all my SONIC when it goes above 1 USDC on @beets-dex
    - Remove my 'Boosted Stable Rings' liquidity when APR goes below 4% on @beets-dex

## Available Functions

- `addLiquidity`: Add liquidity to a pool. Tokens do not need to be proportional as the protocol will automatically zap them for the correct proportions. If you provide one token amount, it will be zapped in the pool alone.
- `removeLiquidity`: Remove liquidity from a pool and return the tokens to the user. The amount of liquidity to be removed is specified as a percentage of the user liquidity (default is 100%). The liquidity will be removed in the same proportions as the pool tokens.
- `executeSwapExactIn`: Get a quote for and then execute a swap where you specify the EXACT AMOUNT YOU WANT TO SEND in order to buy a token. For example: "Swap 1 X for Y", "Sell 1 X for Y", "Buy Y with 1 X".
- `executeSwapExactOut`: Get a quote for and then execute a swap where you specify the EXACT AMOUNT YOU WANT TO RECEIVE of the token you want to buy. For example: "Swap X for 1000 Y", "Sell X for 1000 Y", "Buy 1000 Y with X".
- `getQuoteForSwapExactIn`: Given a FIXED AMOUNT TO SEND ORDER TO BUY A TOKEN, calculate how many tokens will be received in return. For example: "How much Y will I get for 1 X?", "Y I can get for 1 X?".
- `getQuoteForSwapExactOut`: Given a FIXED AMOUNT TO RECEIVE, calculate how many tokens need to be sent. For example: "How much X do I need to buy 1000 Y?", "How much X to receive exactly 1 Y?".
- `getMyPositionsPortfolio`: Show the liquidity positions in the user portfolio. For each position, show the tokens in the pool, the type of pool, the amounts of tokens, the APR yield, and the dollar value of the position.
- `getBestAprForToken`: Show pools with the best APR yield for the given token, sorted by APR. Only includes pools with TVL > $100,000. Will include also pools with tokens equivalent to the given token, e.g. if you ask for Sonic, pools with stS (staked Sonic) will be included too.
- `getBestAprForTokenPair`: Show pools with the best APR yield for the given pair of tokens, sorted by APR. Only includes pools with TVL > $100,000. Will include also pools with tokens equivalent to the given ones, e.g. if you ask for Sonic, pools with stS (staked Sonic) will be included too.
- `getPoolsWithToken`: Show pools with the given token, sorted by TVL. Only includes pools with TVL > $100,000.
- `getPoolsWithTokenPair`: Show pools with the given pair of tokens, sorted by TVL. Only includes pools with TVL > $100,000.
- `getPoolInfoFromPoolId`: Get information about a specific pool, including the APR yield, the TVL, and any positions in the pool belonging to the user.
- `getPoolInfoFromPoolName`: Get information about a specific pool by its name, including the APR yield and the TVL.
- `getTokenAddressFromSymbol`: Get the address of a token from its symbol.

## Installation

```bash
yarn add @heyanon/beets-dex
```

## Test with the askBeets agent

I've built a simple agent called `askBeets` to test the integration. To run it, you need to configure .env:

```bash
cd projects/beets-dex
yarn install
cp .env.example .env
# insert test wallet private key into .env
# insert OpenAI or DeepSeek key into .env
```

and then you can ask questions directly:

```bash
yarn ask "Swap 100 USDC for BEETS"
yarn ask "Add 100 USDC liquidity to Boosted Stable Rings"
yarn ask "Remove half of my liquidity from Boosted Stable Rings"
```

To debug the actual LLM responses, run `askBeets` with `--verbose` flag:

```bash
yarn ask "Swap 100 USDC for BEETS" --verbose
```

## Future improvements

- Check success of liquidity TXs
- Introduce pause between token approvals and swaps/addliq/removeliq?
- Action: Claim incentive rewards
- Action: Stake liquidity
- Action: Unstake liquidity
- Action: Optimism support
- Tell user exact amount received after remove liquidity event
- Allow to remove liquidity to a single token
- Price impact estimation for swaps

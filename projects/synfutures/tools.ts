// tools.ts
import { getChainName } from "@heyanon/sdk";
import { supportedChains } from "./constants";

export const tools = [
    // Trading Functions
    {
        name: "marketOrder",
        description: "Execute a market order for a trading pair with immediate execution",
        examples: [
            "Open a long position with 2 ETH in ETH-USDC at market price",
            "Sell 0.5 BTC at market price with 0.1% slippage tolerance",
            "Buy ETH at market price with maximum slippage of 0.5%"
        ],
        props: [
            {
                name: "chainName",
                type: "string",
                enum: supportedChains.map(getChainName),
                description: "Name of the blockchain network (BASE)"
            },
            {
                name: "tradingPair",
                type: "string",
                description: "Trading pair symbol (e.g., 'ETH-USDC', 'BTC-USDC')"
            },
            {
                name: "side",
                type: "string",
                enum: ["BUY", "SELL"],
                description: "Order side - BUY to long, SELL to short"
            },
            {
                name: "amount",
                type: "string",
                description: "Amount of base token to trade (e.g., '1.0' ETH)"
            },
            {
                name: "slippageTolerance",
                type: "string",
                description: "Maximum acceptable slippage in percentage (e.g., '0.5' for 0.5%)",
                default: "0.5"
            }
        ],
        required: ["chainName", "tradingPair", "side", "amount"]
    },
    {
        name: "limitOrder",
        description: "Place a limit order at a specific price with advanced order types",
        examples: [
            "Place a buy limit order for 1 ETH at 1800 USDC",
            "Set a sell limit order for 0.1 BTC at 35000 USDC with post-only",
            "Create a buy limit order for ETH with a take-profit at 2000 USDC"
        ],
        props: [
            {
                name: "chainName",
                type: "string",
                enum: supportedChains.map(getChainName),
                description: "Name of the blockchain network (BASE)"
            },
            {
                name: "tradingPair",
                type: "string",
                description: "Trading pair symbol (e.g., 'ETH-USDC', 'BTC-USDC')"
            },
            {
                name: "side",
                type: "string",
                enum: ["BUY", "SELL"],
                description: "Order side - BUY to long, SELL to short"
            },
            {
                name: "amount",
                type: "string",
                description: "Amount of base token to trade"
            },
            {
                name: "price",
                type: "string",
                description: "Limit price for the order in quote token"
            },
            {
                name: "postOnly",
                type: "boolean",
                description: "If true, order will only be placed as a maker order",
                default: false
            },
            {
                name: "timeInForce",
                type: "string",
                enum: ["GTC", "IOC", "FOK"],
                description: "Time in force: GTC (Good Till Cancel), IOC (Immediate or Cancel), FOK (Fill or Kill)",
                default: "GTC"
            }
        ],
        required: ["chainName", "tradingPair", "side", "amount", "price"]
    },
    // Position Management
    {
        name: "openPosition",
        description: "Open a leveraged position with advanced risk management",
        examples: [
            "Open a 5x long ETH position with 2 ETH as margin and stop-loss at 1700",
            "Create a 10x short BTC position with take-profit at 40000",
            "Start a 2x long ETH position with trailing stop-loss at 2%"
        ],
        props: [
            {
                name: "chainName",
                type: "string",
                enum: supportedChains.map(getChainName),
                description: "Name of the blockchain network (BASE)"
            },
            {
                name: "tradingPair",
                type: "string",
                description: "Trading pair symbol (e.g., 'ETH-USDC')"
            },
            {
                name: "side",
                type: "string",
                enum: ["LONG", "SHORT"],
                description: "Position side - LONG for bullish, SHORT for bearish"
            },
            {
                name: "leverage",
                type: "string",
                enum: ["2", "5", "10", "15", "25"],
                description: "Leverage multiplier (2x, 5x, 10x, 15x, or 25x)"
            },
            {
                name: "margin",
                type: "string",
                description: "Amount of margin collateral to use"
            },
            {
                name: "stopLoss",
                type: "string",
                description: "Optional stop-loss price",
                default: "0"
            },
            {
                name: "takeProfit",
                type: "string",
                description: "Optional take-profit price",
                default: "0"
            },
            {
                name: "trailingStop",
                type: "string",
                description: "Optional trailing stop percentage",
                default: "0"
            }
        ],
        required: ["chainName", "tradingPair", "side", "leverage", "margin"]
    },
    // Liquidity Management
    {
        name: "provideLiquidity",
        description: "Provide concentrated liquidity with advanced range strategies",
        examples: [
            "Add liquidity to ETH-USDC pool between 1800-2200 USDC with 2 ETH",
            "Provide narrow range liquidity around current price with 1 ETH",
            "Create a wide range position for BTC-USDC with dynamic fees"
        ],
        props: [
            {
                name: "chainName",
                type: "string",
                enum: supportedChains.map(getChainName),
                description: "Name of the blockchain network (BASE)"
            },
            {
                name: "tradingPair",
                type: "string",
                description: "Trading pair symbol (e.g., 'ETH-USDC')"
            },
            {
                name: "amount",
                type: "string",
                description: "Amount of base token to provide as liquidity"
            },
            {
                name: "lowerTick",
                type: "string",
                description: "Lower price tick for liquidity range"
            },
            {
                name: "upperTick",
                type: "string",
                description: "Upper price tick for liquidity range"
            },
            {
                name: "useAutoRange",
                type: "boolean",
                description: "Automatically set range based on current volatility",
                default: false
            },
            {
                name: "dynamicFeeThreshold",
                type: "string",
                description: "Threshold for dynamic fee adjustment",
                default: "0"
            }
        ],
        required: ["chainName", "tradingPair", "amount", "lowerTick", "upperTick"]
    },
    {
        name: "removeLiquidity",
        description: "Remove liquidity with options for partial removal and fee collection",
        examples: [
            "Remove all liquidity from position #123 and collect fees",
            "Withdraw 50% liquidity from ETH-USDC position",
            "Exit position #456 with specific price range"
        ],
        props: [
            {
                name: "chainName",
                type: "string",
                enum: supportedChains.map(getChainName),
                description: "Name of the blockchain network (BASE)"
            },
            {
                name: "positionId",
                type: "string",
                description: "NFT ID of the liquidity position"
            },
            {
                name: "percentage",
                type: "string",
                description: "Percentage of liquidity to remove (1-100)",
                default: "100"
            },
            {
                name: "collectFees",
                type: "boolean",
                description: "Whether to collect accumulated fees",
                default: true
            },
            {
                name: "minAmountOut",
                type: "string",
                description: "Minimum amount of tokens to receive",
                default: "0"
            }
        ],
        required: ["chainName", "positionId"]
    },
    {
        name: "adjustRange",
        description: "Adjust liquidity position range with advanced strategies",
        examples: [
            "Shift position #123 range up by 10% to follow price trend",
            "Widen range for position #456 during high volatility",
            "Narrow position range to increase fee generation"
        ],
        props: [
            {
                name: "chainName",
                type: "string",
                enum: supportedChains.map(getChainName),
                description: "Name of the blockchain network (BASE)"
            },
            {
                name: "positionId",
                type: "string",
                description: "NFT ID of the liquidity position"
            },
            {
                name: "newLowerTick",
                type: "string",
                description: "New lower price tick for liquidity range"
            },
            {
                name: "newUpperTick",
                type: "string",
                description: "New upper price tick for liquidity range"
            },
            {
                name: "adjustmentStrategy",
                type: "string",
                enum: ["SHIFT", "WIDEN", "NARROW"],
                description: "Strategy for range adjustment",
                default: "SHIFT"
            },
            {
                name: "rebalanceTokens",
                type: "boolean",
                description: "Whether to rebalance token amounts during adjustment",
                default: false
            }
        ],
        required: ["chainName", "positionId", "newLowerTick", "newUpperTick"]
    },
    {
        name: "claimFees",
        description: "Claim accumulated trading fees with compound options",
        examples: [
            "Collect all fees from position #123",
            "Claim and reinvest fees from ETH-USDC position",
            "Harvest fees from multiple positions"
        ],
        props: [
            {
                name: "chainName",
                type: "string",
                enum: supportedChains.map(getChainName),
                description: "Name of the blockchain network (BASE)"
            },
            {
                name: "positionId",
                type: "string",
                description: "NFT ID of the liquidity position"
            },
            {
                name: "reinvest",
                type: "boolean",
                description: "Automatically reinvest claimed fees into position",
                default: false
            },
            {
                name: "claimAll",
                type: "boolean",
                description: "Claim fees from all positions owned by the account",
                default: false
            }
        ],
        required: ["chainName", "positionId"]
    }
]; 
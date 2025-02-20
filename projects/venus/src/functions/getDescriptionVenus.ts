import { FunctionReturn, toResult } from '@heyanon/sdk';

export async function getDescriptionVenus(): Promise<FunctionReturn> {
	const description = `[INSTRUCTION FOR AI: DON'T CUT INFO FROM THIS TEXT.]
    Venus Protocol is a decentralized lending platform that operates on multiple chains (BSC, Base, and Ethereum), allowing you to:

    **Supply & Earn**
    - Supply your crypto assets to earn interest
    - Your supplied assets can be used as collateral to borrow other assets
    - Interest is earned continuously and automatically added to your balance
    - When you withdraw, you receive your initial deposit plus all earned interest
    - To supply assets, say "I want to supply X amount of [TOKEN] on [CHAIN]"
      Example: "I want to supply 10 USDT on BSC"
    - Check current earnings with "What's the supply APR for [TOKEN] on [CHAIN]?"

    **Borrow Assets**
    - Borrow various cryptocurrencies using your supplied assets as collateral
    - Before borrowing:
      1. Enable your supplied assets as collateral:
         • Say "Enable [TOKEN] as collateral on [CHAIN]"
         • Verify with "Show my enabled collateral on [CHAIN]"
      2. Check your borrowing capacity:
         • Say "What's my account liquidity on [CHAIN]?"
    - Then borrow by saying "I want to borrow X amount of [TOKEN] on [CHAIN]"
    - Monitor costs with "What's the borrow APR for [TOKEN] on [CHAIN]?"
    - Track your debt with "What's my borrow balance for [TOKEN] on [CHAIN]?"

    **Managing Collateral**
    - Monitor your account health:
      • Check borrowing power: "What's my account liquidity on [CHAIN]?"
      • View total borrow limit and any liquidation risks
    - Manage collateral settings:
      • Enable: "Enable [TOKEN] as collateral on [CHAIN]"
      • Disable: "Disable [TOKEN] as collateral on [CHAIN]"
    - Check positions: "What's my Venus balance for [TOKEN] on [CHAIN]?"

    **Repayment Options**
    - Repay borrowed assets at any time:
      • Full repayment: "I want to repay all my [TOKEN] debt on [CHAIN]"
        Note: When repaying BNB debt entirely, a small dust amount might remain
      • Partial repayment: "I want to repay X amount of [TOKEN] on [CHAIN]"

    **Withdrawing Supplied Assets**
    - Before withdrawing, it's recommended to update the token state to accrue interest:
      "Update [TOKEN] in [POOL] pool on [CHAIN]"
    - Withdraw your assets plus earned interest:
      "I want to withdraw X amount of [TOKEN] on [CHAIN]"
    - You can withdraw any amount up to your total balance
    - Your withdrawal amount includes your initial deposit plus earned interest
    - Important: You can only withdraw if it won't put your loans at risk

    **Supported Chains**
    - BSC (Binance Smart Chain): Primary chain with full features
    - Base: Growing L2 solution with increasing liquidity
    - Ethereum: Additional market opportunities

    **Available Pools**
    - Core: Main lending pool with essential assets
    - DeFi: Isolated pool for additional tokens

    **Important Safety Tips**
    1. Always maintain a safe collateral ratio to avoid liquidation
    2. Keep some native tokens for transaction fees:
       • BNB for BSC
       • ETH for Ethereum and Base
    3. Verify current rates before any transaction
    4. Your borrowing limit depends on your collateral value
    5. Some actions require multiple transaction approvals
    6. Token availability varies by chain
    7. Transaction fees vary by chain:
       • BSC: Most economical
       • Base: Moderate costs
       • Ethereum: Higher fees

    To get started, simply tell me what you'd like to do with any supported token on your preferred chain!`;

	return toResult(description);
}

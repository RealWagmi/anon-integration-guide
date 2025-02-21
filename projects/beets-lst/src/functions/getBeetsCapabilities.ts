import { FunctionReturn, toResult } from '@heyanon/sdk';

/**
 * Returns a description of Beets LST capabilities and example prompts.
 *
 * @returns {Promise<FunctionReturn>} A message describing Beets LST features
 */
export async function getBeetsCapabilities(): Promise<FunctionReturn> {
    return toResult(
        `Beets LST allows you to access Sonic staking rewards while maintaining full liquidity of your assets. Your stS tokens remain liquid and composable, allowing you to earn staking rewards while participating in DeFi opportunities.

Here's what you can do with Beets LST:

1. STAKING
    - "Stake 100 S in @beets-lst"
    - "Stake half of my Sonic in @beets-lst"
    - "How much do I have staked in @beets-lst?"
    - "Show my position in @beets-lst"

2. UNSTAKING
    - "Unstake all from @beets-lst"
    - "Unstake half from @beets-lst"
    - "Unstake 100 stS from @beets-lst"

3. WITHDRAWING
    - "Withdraw all from @beets-lst"
    - "Withdraw <withdraw_id> from @beets-lst"
    - "How long before I can withdraw from @beets-lst?"
    - "Show my pending withdrawals on @beets-lst"

4. INFORMATION & ALERTS
    - "What is the APR of staking Sonic on @beets-lst?"
    - "Alert me when my withdrawal is ready @beets-lst"
    - "How much Sonic does @beets-lst hold?"
    - "How much is worth my staked Sonic on @beets-lst?"

Just ask your question in natural language and I'll help you interact with Beets LST!`,
    );
}

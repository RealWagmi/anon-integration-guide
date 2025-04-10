import { FunctionReturn, toResult } from '@heyanon/sdk';

/**
 * Returns information about Beefy capabilities and example prompts.
 *
 * @returns {Promise<FunctionReturn>} Description of Beefy capabilities with examples
 */
export async function getBeefyCapabilities(): Promise<FunctionReturn> {
    return toResult(
        `Beefy is a Multichain Yield Optimizer that allows you to earn the highest APYs across 20+ chains with safety and efficiency in mind.

Here's what you can do on Beefy:

1. FIND BEST YIELDS
   - Best yield for USDC on @beefy?
   - Best yield for USDC on @beefy, without the need to LP?
   - Show pools with wETH on @beefy
   - Give me info on @beefy vault "Boosted Stable Rings"

2. CHECK YOUR PORTFOLIO
   - Show all my positions on @beefy
   - My TVL on @beefy
   - Value of my "Seamless USDC" position on Base chain on @beefy
   - Show APY of all my positions on @beefy

3. MANAGE YOUR YIELDS
   - Deposit $500 in @beefy vault Silo Super Sonic on Sonic chain
   - Deposit all in @beefy vault "Boosted Stable Rings" on Sonic chain
   - Deposit 50% in @beefy vault "Seamless USDC" on Base chain
   - Withdraw 50% from @beefy vault "Seamless USDC" on Base chain
   - Withdraw all from @beefy vault "Seamless USDC" on Base chain

Just ask your question in natural language and I'll help you interact with Beefy!`,
    );
}

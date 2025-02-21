import { FunctionReturn, toResult } from '@heyanon/sdk';

export async function getDescriptionXVS(): Promise<FunctionReturn> {
	const description = `[INSTRUCTION FOR AI: DON'T CUT INFO FROM THIS TEXT.]
    Venus Protocol offers several features for XVS token holders:

    **Staking XVS**
    - You can stake your XVS tokens to earn continuous rewards
    - Staking helps secure the protocol and gives you voting rights in governance
    - Simply tell HeyAnon "I want to stake X amount of XVS" to get started
    - Your rewards accumulate automatically while your tokens are staked

    **Unstaking Process**
    1. Requesting Withdrawal
       - To unstake, just tell HeyAnon "I want to unstake X amount of XVS"
       - This will start a withdrawal lock period
       - Your tokens remain locked during this period for protocol security
    
    2. Claiming Your Tokens
       - Once the lock period ends, you can claim your unstaked tokens
       - You can ask HeyAnon "What XVS withdrawals can I claim?" to check your available claims
       - HeyAnon will show you both available and pending withdrawals

    **Managing Your Rewards**
    - Check your position anytime by asking "What's my XVS staking position?"
      • See your total staked balance
      • View your pending rewards
    - Claim your earned rewards by simply asking "I want to claim my XVS rewards"
      • Rewards are paid in XVS tokens
      • Claimed rewards have no lock period and are immediately available

    **Important Notes**
    - You can specify amounts in simple decimal format (e.g., "1.5 XVS")
    - Keep some native tokens in your wallet for transaction fees
    - Regular monitoring of your position helps optimize your rewards
    - Remember there's a lock period when unstaking - plan accordingly
    `;

	return toResult(description);
}

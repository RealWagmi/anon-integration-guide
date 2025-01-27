# **Lido Protocol - Liquid Staking for Ethereum**

## **Overview**

Lido is a decentralized liquid staking protocol for Ethereum that enables users to stake ETH while maintaining liquidity. By staking ETH through Lido, users receive **stETH**, a liquid staking token, in return. stETH can be utilized across other DeFi protocols while simultaneously earning staking rewards, offering a unique blend of liquidity and yield generation compared to traditional staking models.

## **What Lido Protocol Can Do for You**

- **Flexible Staking & Unstaking**: Stake ETH and receive stETH tokens. Unstaking initiates a withdrawal process to retrieve ETH.
- **Liquid Staking Tokens**: Receive stETH tokens that represent your staked position, which remain fully liquid and can be used across DeFi while earning staking rewards.
- **Safe and Decentralized**: Your staked assets are automatically distributed across carefully selected validators, providing enhanced decentralization and risk management.
- **Real-time Rewards**: Track the value of your staked positions with real-time staking rewards that accrue directly to your stETH balance.
- **Seamless Withdrawals**: Manage withdrawal requests efficiently, allowing you to unstake and retrieve ETH when needed.

## **Supported Networks**

- **Ethereum**: Stake ETH and receive stETH for liquidity and DeFi strategies.

## **Common Tasks**

### **Staking**

- Stake ETH to receive stETH:
  - "Stake 1 ETH in Lido."
  - "Stake half of my ETH in Lido."
  - "How many stETH do I have in Lido?"
- Show your staked position:
  - "Show my position in Lido."

### **Unstaking**

- Unstake stETH to retrieve ETH:
  - "Unstake 2 stETH from Lido."
  - "Unstake all of my stETH from Lido."
  - "Unstake 5 ETH worth of stETH from Lido."

### **Withdrawals**

- Manage withdrawal requests:
  - "Request withdrawal of stETH."
  - "Withdraw all available ETH from Lido."
  - "Show my open withdrawals in Lido."

### **Information Queries**

- Retrieve staking details:
  - "Check my stETH balance in Lido."
  - "Get the current staking rewards rate in Lido."
  - "How much is 1 stETH worth in ETH?"
- Track rewards:
  - "What are my current staking rewards in Lido?"
  - "Calculate expected rewards for staking 5 ETH."

## **Available Functions**

- [stakeETH](functions/stakeETH.ts)
- [wrapStETH](functions/wrapStETH.ts)
- [unwrapWstETH](functions/unwrapWstETH.ts)
- [getStETHBalance](functions/getStETHBalance.ts)
- [getWstETHBalance](functions/getWstETHBalance.ts)
- [requestWithdrawal](functions/requestWithdrawal.ts)
- [claimWithdrawal](functions/claimWithdrawal.ts)
- [getWstETHForStETH](functions/getWstETHForStETH.ts)
- [getStETHForWstETH](functions/getStETHForWstETH.ts)
- [getTotalStaked](functions/getTotalStaked.ts)
- [unlockStETH](functions/unlockStETH.ts)
- [getStETHAllowance](functions/getStETHAllowance.ts)
- [getTotalRewardsEarned](functions/getTotalRewardsEarned.ts)
- [calculateAPR](functions/calculateAPR.ts)

## **Contracts and Transactions**

- Liquid staking proxy contract: [Etherscan](https://etherscan.io/address/0xe5da20f15420ad15de0fa650600afc998bbe3955)
- Liquid staking implementation contract: [Etherscan](https://etherscan.io/address/0xd5f7fc8ba92756a34693baa386edcc8dd5b3f141)
- Stake ETH TX (`stake`): [Etherscan](https://etherscan.io/tx/0x19545670b77c9ab7e1eabdab292c1aa9d0abd6e11777ab3147f343cb900c728b)
- Unstake TX (`unstake`): [Etherscan](https://etherscan.io/tx/0xb64c4fd6ae4667a3b7ce9d6ba9679fbd2c591173a0895a5616adc3b039b10c27)
- Claim withdrawal TX (`claimWithdrawal`): [Etherscan](https://etherscan.io/tx/0xb93b07384ccbace4236d07fac46874039821c84707f69fbee101e9ae5506f470)

## **Installation**

To install Lido’s protocol package, run the following:

```bash
yarn add @heyanon/lido
```

## **Usage**

Example usage of the Lido Protocol:

```javascript
import { stakeETH, getStETHBalance, unlockStETH } from "@heyanon/lido";

async function example() {
  const staked = await stakeETH({ amount: "1" });
  console.log("Staked ETH:", staked);

  const balance = await getStETHBalance({ account: "0xYourAddress" });
  console.log("stETH Balance:", balance);

  const unlock = await unlockStETH({
    chainName: "Ethereum",
    account: "0xYourAddress",
    amount: "1",
  });
  console.log("Unlock stETH:", unlock);
}
```

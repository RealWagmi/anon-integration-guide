import { 
  Address, 
  encodeFunctionData,
  parseEther 
} from "viem";
import { 
  FunctionReturn, 
  FunctionOptions, 
  TransactionParams, 
  toResult, 
  getChainFromName,
} from "@heyanon/sdk";
import { 
  supportedChains, 
  stETH_ADDRESS 
} from "../constants";
import  lidoAbi from "../abis/lidoAbi";

interface Props {
  chainName: string;
  account: Address;
  amount: string;
}

export async function stakeETH(
  { chainName, account, amount }: Props,
  { sendTransactions, notify }: FunctionOptions
): Promise<FunctionReturn> {
  if (!account) {
      return toResult("Wallet not connected", true);
  }

  const chainId = getChainFromName(chainName);
  if (!chainId || !supportedChains.includes(chainId)) {
      return toResult(`Unsupported chain: ${chainName}`, true);
  }

  if (!amount || parseFloat(amount) <= 0) {
      return toResult("Invalid stake amount", true);
  }

  try {
      const amountInWei = parseEther(amount);

      await notify(`Preparing to stake ${amount} ETH...`);

      const tx: TransactionParams = {
          target: stETH_ADDRESS,
          data: encodeFunctionData({
              abi: lidoAbi,
              functionName: "submit",
              args: [account],
          }),
          value: amountInWei,
      };

      await notify("Waiting for transaction confirmation...");

      const result = await sendTransactions({
          chainId,
          account,
          transactions: [tx],
      });

      const stakeMessage = result.data[result.data.length - 1];
      
      return toResult(
          result.isMultisig 
              ? stakeMessage.message 
              : `Successfully staked ${amount} ETH. ${stakeMessage.message}`
      );
  } catch (error) {
      return toResult(
          `Failed to stake ETH: ${error instanceof Error ? error.message : "Unknown error"}`,
          true
      );
  }
}
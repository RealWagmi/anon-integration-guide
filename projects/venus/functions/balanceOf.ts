import {
  Address,
  formatUnits
} from "viem";
import {
  FunctionReturn,
  FunctionOptions,
  toResult,
  getChainFromName,
} from "@heyanon/sdk";
import {
  supportedChains,
  VBNB_ADDRESS,
} from "../constants";
import { vBNBAbi } from "../abis/vBNBAbi";
interface Props {
  chainName: string;
  account: Address;
  token: string;
}

/**
 * Retrieves the balance of token from the Venus protocol.
 * 
 * @returns {Promise<FunctionReturn>} - The balance of Token.
 */
export async function balanceOf( { chainName, account, token }: Props,
  { notify, getProvider }: FunctionOptions): Promise<FunctionReturn> {
  // Validate chain
  const chainId = getChainFromName(chainName);
  if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
  if (supportedChains.indexOf(chainId) === -1)
    return toResult(`Protocol is not supported on ${chainName}`, true);
  try {
    const provider = getProvider(chainId);
    await notify('Checking Balance of token...');
    const balanceOf = await provider.readContract({
      abi: vBNBAbi,
      address: VBNB_ADDRESS,
      functionName: 'balanceOf',
      args: [account],
    }) as bigint;
    //All vTokens are 8 decimals
    return toResult(`Balance of ${token}: ${formatUnits(balanceOf, 8)}`);
  } catch (error) {
    return toResult(
        `Failed to mint token: ${error instanceof Error ? error.message : "Unknown error"}`,
        true
    );
  }
}
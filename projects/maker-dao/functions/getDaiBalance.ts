import { Address, formatUnits } from "viem";
import { FunctionReturn, toResult, getChainFromName, FunctionOptions } from "@heyanon/sdk";
import dsrManagerAbi from "../abis/DsrManager.abi.json";
import { DSR_ADDRESS } from "../constants";

interface Props {
  chainName: string;
  userAddress: Address;
}

/**
 * Calculates and returns the Dai balance of the specified address usr in the DsrManager contract. (Existing Dai balance + earned dsr).
 * @param props - The query parameters.
 * @param options - The function options.
 * @returns The user's rewards information.
 */
export async function getDaiBalance({
  chainName,
  userAddress,
}: Props, { getProvider }: FunctionOptions): Promise<FunctionReturn> {
  if (!userAddress) {
    return toResult("User address is required", true);
  }

  const chainId = getChainFromName(chainName);
  if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);

  const publicClient = getProvider(chainId);

  // Calculates and returns the Dai balance of the specified address usr in the DsrManager contract. (Existing Dai balance + earned dsr)
  const daiBalance = await publicClient.readContract({
    address: DSR_ADDRESS,
    abi: dsrManagerAbi,
    functionName: 'daiBalance',
    args: [userAddress],
  }) as any;

  return toResult(`DAI balance: ${formatUnits(daiBalance, 18)} DAI`);
}
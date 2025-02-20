import { FunctionReturn, toResult, EVM, EvmChain } from "@heyanon/sdk";
import { Address } from "viem";
import { supportedChains } from "../constants";
import { OrderBookApi } from "@cowprotocol/cow-sdk";

interface Props {
  chainName: string;
  account: Address;
}

export async function getOrders({
  chainName,
  account,
}: Props): Promise<FunctionReturn> {
  // Check wallet connection
  if (!account) return toResult("Wallet not connected", true);

  // Validate chain
  const chainId = EVM.utils.getChainFromName(chainName as EvmChain);
  if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
  if (!supportedChains.includes(chainId))
    return toResult(`Protocol is not supported on ${chainName}`, true);

  const orderBookApi = new OrderBookApi({ chainId: chainId as number });

  const orders = await orderBookApi.getOrders({ owner: account, limit: 500 });

  return toResult(JSON.stringify(orders));
}

import {
  FunctionReturn,
  toResult,
  FunctionOptions,
  EVM,
  EvmChain,
} from "@heyanon/sdk";
import { Address, getContract, encodeFunctionData } from "viem";

import {
  LBRouterV22ABI,
  LB_ROUTER_V22_ADDRESS,
  LBPairV21ABI,
  PairV2,
} from "@traderjoe-xyz/sdk-v2";
import { getTokenInfo } from "../utils";
import { supportedChains } from "../constants";
import { ChainId } from "@traderjoe-xyz/sdk-core";

const { getChainFromName } = EVM.utils;

interface Props {
  chainName: string;
  tokenX: Address;
  tokenY: Address;
  account: Address;
  binStep: number;
}

export async function removeLiquidity(
  { chainName, tokenX, tokenY, account, binStep }: Props,
  options: FunctionOptions,
): Promise<FunctionReturn> {
  const {
    evm: { getProvider, sendTransactions },
  } = options;
  // Check wallet connection
  if (!account) return toResult("Wallet not connected", true);

  // Validate chain
  const chainId = getChainFromName(chainName as EvmChain);
  if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
  if (!supportedChains.includes(chainId))
    return toResult(`Protocol is not supported on ${chainName}`, true);

  if (tokenX == tokenY)
    return toResult(
      "Parameters `tokenX` and `tokenY` cannot be the same",
      true,
    );

  const provider = getProvider(chainId);

  const tokenXInfo = await getTokenInfo(chainId as number, provider, tokenX);
  const tokenYInfo = await getTokenInfo(chainId as number, provider, tokenY);

  if (!tokenXInfo) return toResult("Invalid ERC20 address for `tokenX`", true);
  if (!tokenYInfo) return toResult("Invalid ERC20 address for `tokenY`", true);

  const pair = new PairV2(tokenXInfo, tokenYInfo);
  const pairVersion = "v22";
  const lbPair = await pair.fetchLBPair(
    binStep,
    pairVersion,
    provider,
    chainId as number,
  );

  if (lbPair.LBPair == "0x0000000000000000000000000000000000000000") {
    return toResult("No LB pair found with the given parameters", true);
  }

  const lbPairData = await PairV2.getLBPairReservesAndId(
    lbPair.LBPair,
    pairVersion,
    provider,
  );
  const activeBinId = lbPairData.activeId;
  const pairContract = getContract({
    address: lbPair.LBPair,
    abi: LBPairV21ABI,
    client: provider,
  });

  const range = 200;
  const addressArray = Array.from<Address>({ length: 2 * range + 1 }).fill(
    account,
  );
  const binsArray: bigint[] = [];
  for (let i = activeBinId - range; i <= activeBinId + range; i++) {
    binsArray.push(BigInt(i));
  }

  const allBins = await provider.readContract({
    address: pairContract.address,
    abi: pairContract.abi,
    functionName: "balanceOfBatch",
    args: [addressArray, binsArray],
  });

  const userOwnedbins = binsArray.filter((_, index) => allBins[index] !== 0n);
  const nonZeroAmounts = allBins.filter((amount) => amount !== 0n);

  const isApproved = await provider.readContract({
    address: pairContract.address,
    abi: pairContract.abi,
    functionName: "isApprovedForAll",
    args: [account, LB_ROUTER_V22_ADDRESS[chainId as ChainId]],
  });

  if (!isApproved) {
    const tx: EVM.types.TransactionParams = {
      target: pairContract.address,
      data: encodeFunctionData({
        abi: pairContract.abi,
        functionName: "approveForAll",
        args: [LB_ROUTER_V22_ADDRESS[chainId as ChainId], true],
      }),
    };

    await sendTransactions({
      chainId,
      account,
      transactions: [tx],
    });
  }

  const currentTimeInSec = Math.floor(new Date().getTime() / 1000);
  const removeLiquidityInput = {
    tokenX,
    tokenY,
    binStep,
    amountXmin: BigInt(0),
    amountYmin: BigInt(0),
    ids: userOwnedbins,
    amounts: nonZeroAmounts,
    to: account,
    deadline: BigInt(currentTimeInSec + 3600),
  };

  const tx: EVM.types.TransactionParams = {
    target: LB_ROUTER_V22_ADDRESS[chainId as ChainId],
    data: encodeFunctionData({
      abi: LBRouterV22ABI,
      functionName: "removeLiquidity",
      args: [
        removeLiquidityInput.tokenX,
        removeLiquidityInput.tokenY,
        removeLiquidityInput.binStep,
        removeLiquidityInput.amountXmin,
        removeLiquidityInput.amountYmin,
        removeLiquidityInput.ids,
        removeLiquidityInput.amounts,
        removeLiquidityInput.to,
        removeLiquidityInput.deadline,
      ],
    }),
  };

  await sendTransactions({
    chainId,
    account,
    transactions: [tx],
  });

  return toResult("Successfully removed liquidity");
}

import { Address, parseUnits, encodeFunctionData, erc20Abi } from 'viem';
import { FunctionReturn, FunctionOptions, TransactionParams, toResult, getChainFromName, checkToApprove, WETH9 } from '@heyanon/sdk';
import { supportedChains, swapBases } from '../constants';
import { PairV2, TradeV2 } from '@traderjoe-xyz/sdk-v2';
import { Token } from '@traderjoe-xyz/sdk-core';

interface Props {
    chainName: string;
    account: Address;
    amount: string;

    slippage?: number;
    buyToken: Address;
    sellToken: Address;
}

export async function swapExactIn(
    { chainName, account, amount, buyToken, sellToken, slippage = 0.5 }: Props,
    { sendTransactions, notify, getProvider }: FunctionOptions,
): Promise<FunctionReturn> {
    // Check wallet connection
    if (!account) return toResult('Wallet not connected', true);

    // Validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Protocol is not supported on ${chainName}`, true);

    // Validate amount
    const amountInWei = parseUnits(amount, 18);
    if (amountInWei === 0n) return toResult('Amount must be greater than 0', true);

    const wrappedNative = WETH9[chainId];

    let isNativeIn = buyToken == wrappedNative.address;
    let isNativeOut = sellToken == wrappedNative.address;

    if (isNativeIn && isNativeOut) return toResult('Invalid arguments', true);

    const bases = swapBases[chainId];

    PairV2.createAllTokenPairs(sellToken, buyToken, bases);

    return {};
}

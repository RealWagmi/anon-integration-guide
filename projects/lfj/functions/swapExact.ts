import { Address, parseUnits, encodeFunctionData } from 'viem';
import { FunctionReturn, FunctionOptions, TransactionParams, toResult, getChainFromName, checkToApprove, WETH9 } from '@heyanon/sdk';
import { supportedChains, swapBases } from '../constants';
import { LBRouterV22ABI, LB_ROUTER_V22_ADDRESS, PairV2, RouteV2, TradeOptions, TradeV2 } from '@traderjoe-xyz/sdk-v2';
import { Percent, TokenAmount } from '@traderjoe-xyz/sdk-core';

import { getTokenInfo } from '../utils';

interface Props {
    isExactIn: boolean;
    chainName: string;
    account: Address;
    amount: string;
    recipient?: Address;

    maxSlippageInPercentage?: string;
    inputTokenAddress: Address;
    outputTokenAddress: Address;
}

export async function swapExact(
    { chainName, account, amount, inputTokenAddress, outputTokenAddress, isExactIn, maxSlippageInPercentage = '0.5', recipient = account }: Props,
    { sendTransactions, notify, getProvider }: FunctionOptions,
): Promise<FunctionReturn> {
    // Check wallet connection
    if (!account) return toResult('Wallet not connected', true);

    // Validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Protocol is not supported on ${chainName}`, true);

    if (inputTokenAddress == outputTokenAddress) return toResult('`inputTokenAddress` cannot be the same as `outputTokenAddress`', true);

    // Make sure that `buyTokenAddress` and `sellTokenAddress` is a valid ERC20 token
    const provider = getProvider(chainId);
    const inputToken = await getTokenInfo(chainId as number, provider, inputTokenAddress);
    const outputToken = await getTokenInfo(chainId as number, provider, outputTokenAddress);

    if (!inputToken) return toResult('Invalid ERC20 address for `inputTokenAddress`', true);
    if (!outputToken) return toResult('Invalid ERC20 address for `outputTokenAddress`', true);

    if (Number(amount) < 0) return toResult('`amount` cannot be less than 0', true);

    await notify('Calculating the best route ...');

    const bases = swapBases[chainId];
    const allTokenPairs = PairV2.createAllTokenPairs(inputToken, outputToken, bases);
    const allPairs = PairV2.initPairs(allTokenPairs);
    const allRoutes = RouteV2.createAllRoutes(allPairs, inputToken, outputToken);

    const wrappedNative = WETH9[chainId];
    const isNativeIn = inputTokenAddress == wrappedNative.address;
    const isNativeOut = outputTokenAddress == wrappedNative.address;

    const amountInParsed = parseUnits(amount, inputToken.decimals);
    const amountIn = new TokenAmount(inputToken, amountInParsed);
    const trades = await TradeV2.getTradesExactIn(allRoutes, amountIn, outputToken, isNativeIn, isNativeOut, provider, chainId as number);

    const bestTrade = TradeV2.chooseBestTrade(trades as TradeV2[], isExactIn);
    if (!bestTrade) {
        return toResult('Cannot find a valid route', true);
    }

    const maxSlippageInDecimal = (parseInt(maxSlippageInPercentage) * 100).toString();
    const userSlippageTolerance = new Percent(maxSlippageInDecimal, '10000');
    const swapOptions: TradeOptions = {
        allowedSlippage: userSlippageTolerance,
        ttl: 3600,
        recipient,
        feeOnTransfer: false,
    };

    await notify(`Swapping ${bestTrade.inputAmount} ${inputToken.symbol} to ${bestTrade.outputAmount} ${outputToken.symbol} ...`);

    await checkToApprove({
        args: {
            account,
            target: inputTokenAddress,
            spender: LB_ROUTER_V22_ADDRESS[chainId],
            amount: amountInParsed,
        },
        transactions: [],
        provider,
    });

    const { methodName, args, value } = bestTrade.swapCallParameters(swapOptions);
    const tx: TransactionParams = {
        target: LB_ROUTER_V22_ADDRESS[chainId],
        data: encodeFunctionData({
            abi: LBRouterV22ABI,
            methodName: methodName,
            // @ts-ignore
            args: args,
        }),
        value: BigInt(value),
    };

    const result = await sendTransactions({ chainId, account, transactions: [tx] });
    const swapMessage = result.data[result.data.length - 1];

    return toResult(
        result.isMultisig
            ? swapMessage.message
            : `Successfully swapped ${bestTrade.inputAmount} ${inputToken.symbol} to ${bestTrade.outputAmount} ${outputToken.symbol}. ${swapMessage.message}`,
    );
}

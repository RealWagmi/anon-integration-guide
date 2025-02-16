import { FunctionReturn, toResult, getChainFromName, FunctionOptions, checkToApprove, TransactionParams } from '@heyanon/sdk';
import { Address, parseUnits, encodeFunctionData } from 'viem';
import { VoidSigner } from '@ethersproject/abstract-signer';
import { supportedChains } from '../constants';
import {
    COW_PROTOCOL_VAULT_RELAYER_ADDRESS,
    COW_PROTOCOL_SETTLEMENT_CONTRACT_ADDRESS,
    LimitOrderParameters,
    OrderKind,
    SigningScheme,
    SwapAdvancedSettings,
    TradingSdk,
} from '@cowprotocol/cow-sdk';
import { getTokenInfo, slippageToleranceToBips } from '../utils';
import { cowswapSettlementAbi } from '../abis/cowswap_settlement_abi';

interface Props {
    chainName: string;
    account: Address;
    slippageTolerance: string | null;

    sellToken: Address;
    sellTokenPrice: string;
    sellTokenAmount: string;
    buyTokenPrice: string;
    buyToken: Address;
}

export async function postLimitSellOrder(
    { chainName, account, sellToken, buyToken, buyTokenPrice, sellTokenPrice, sellTokenAmount, slippageTolerance }: Props,
    { signMessages, getProvider, sendTransactions, notify }: FunctionOptions,
): Promise<FunctionReturn> {
    // Check wallet connection
    if (!account) return toResult('Wallet not connected', true);
    if (!slippageTolerance) slippageTolerance = '0.5';

    // Validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Protocol is not supported on ${chainName}`, true);

    const provider = getProvider(chainId);
    if (!signMessages) return toResult('Missing parameter `signMessages`', true);

    const sellTokenInfo = await getTokenInfo(sellToken, provider);
    if (!sellTokenInfo) return toResult('Invalid ERC20 for sellToken', true);
    const buyTokenInfo = await getTokenInfo(buyToken, provider);
    if (!buyTokenInfo) return toResult('Invalid ERC20 for buyToken', true);

    // We use VoidSigner since we settle orders on chain by sending a transaction.
    const signer = new VoidSigner(account);
    const sdk = new TradingSdk({
        chainId: chainId as number,
        signer,
        appCode: 'HeyAnon',
    });
    const sellTokenPriceBN = parseUnits(sellTokenPrice, 18);
    const buyTokenPriceBN = parseUnits(buyTokenPrice, 18);

    const sellTokenAmountBN = parseUnits(sellTokenAmount, sellTokenInfo.decimals);
    const buyTokenAmountBN = (buyTokenPriceBN / sellTokenPriceBN) * sellTokenAmountBN;
    const buyTokenAmount =  parseUnits(formatUnits(buyTokenAmountBN, sellTokenInfo.decimals), buyTokenInfo.decimals);
    
    const approval = [];

    await checkToApprove({
        args: {
            account,
            target: sellToken,
            spender: COW_PROTOCOL_VAULT_RELAYER_ADDRESS[chainId],
            amount: sellTokenAmountBN,
        },
        transactions: approval,
        provider,
    });

    await notify(`Approving ${sellTokenAmount} of ${sellTokenInfo.symbol}`);

    await sendTransactions({
        chainId,
        account,
        transactions: approval,
    });

    await notify(`Processing limit sell order ...`);

    const slippageToleranceToBipsResult = slippageToleranceToBips(slippageTolerance);
    if (!slippageToleranceToBipsResult.success) {
        return toResult(slippageToleranceToBipsResult.message, true);
    }

    const parameters: LimitOrderParameters = {
        kind: OrderKind.SELL,
        sellToken,
        slippageBps: slippageToleranceToBipsResult.result,
        sellTokenDecimals: sellTokenInfo.decimals,
        buyToken,
        buyTokenDecimals: buyTokenInfo.decimals,
        sellAmount: sellTokenAmountBN.toString(),
        buyAmount: buyTokenAmountBN.toString(),
        chainId: chainId as number,
        signer,
        appCode: 'HeyAnon',
    };

    const settings: SwapAdvancedSettings = {
        quoteRequest: {
            signingScheme: SigningScheme.PRESIGN,
        },
    };

    const orderUid = await sdk.postLimitOrder(parameters, settings);
    const tx: TransactionParams = {
        target: COW_PROTOCOL_SETTLEMENT_CONTRACT_ADDRESS[chainId] as `0x{string}`,
        data: encodeFunctionData({
            abi: cowswapSettlementAbi,
            functionName: 'setPreSignature',
            args: [orderUid, true],
        }),
    };

    await sendTransactions({
        chainId,
        account,
        transactions: [tx],
    });

    return toResult(
        `
Successfully posted a limit order to swap ${sellTokenAmount} ${sellTokenInfo.symbol} to ${buyTokenInfo.symbol} when ${sellTokenInfo} is at minimum ${sellTokenPrice}. 
OrderUid: ${orderUid}
Slippage: ${slippageTolerance}
`,
    );
}

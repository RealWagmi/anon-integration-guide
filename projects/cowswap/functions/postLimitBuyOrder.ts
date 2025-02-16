import { FunctionReturn, toResult, getChainFromName, FunctionOptions, checkToApprove, TransactionParams } from '@heyanon/sdk';
import { Address, parseUnits, encodeFunctionData } from 'viem';
import { supportedChains } from '../constants';
import { VoidSigner } from '@ethersproject/abstract-signer';
import {
    COW_PROTOCOL_SETTLEMENT_CONTRACT_ADDRESS,
    COW_PROTOCOL_VAULT_RELAYER_ADDRESS,
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
    buyTokenAmount: string;
    buyTokenPrice: string;
    buyToken: Address;
}

export async function postLimitBuyOrder(
    { chainName, account, sellToken, buyToken, buyTokenPrice, sellTokenPrice, buyTokenAmount, slippageTolerance }: Props,
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

    const buyTokenAmountBN = parseUnits(buyTokenAmount, buyTokenInfo.decimals);
    const sellTokenAmountBN = (sellTokenPriceBN * buyTokenAmountBN) / buyTokenPriceBN;
    const sellAmount = parseUnits(formatUnits(sellTokenAmountBN, buyTokenInfo.decimals), sellTokenInfo.decimals);

    await notify(`Approving ${sellTokenInfo.symbol} ...`);
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

    await sendTransactions({
        chainId,
        account,
        transactions: approval,
    });

    await notify(`Processing limit buy order ...`);

    const slippageToleranceToBipsResult = slippageToleranceToBips(slippageTolerance);
    if (!slippageToleranceToBipsResult.success) {
        return toResult(slippageToleranceToBipsResult.message, true);
    }

    const parameters: LimitOrderParameters = {
        kind: OrderKind.BUY,
        slippageBps: slippageToleranceToBipsResult.result,
        sellToken,
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
Successfully posted a limit order to swap ${sellAmount} ${sellTokenInfo.symbol} to ${buyTokenInfo.symbol} when ${buyTokenInfo.symbol} is at minimum ${buyTokenPrice}. 
OrderUid: ${orderUid}
Slippage: ${slippageTolerance}
`,
    );
}

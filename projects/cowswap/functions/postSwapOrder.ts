import { Address, parseUnits } from 'viem';
import { FunctionReturn, FunctionOptions, toResult, getChainFromName } from '@heyanon/sdk';
import { HeyAnonSigner, supportedChains } from '../constants';
import { OrderBookApi, OrderQuoteRequest, OrderQuoteSideKindSell, OrderSigningUtils, SigningScheme } from '@cowprotocol/cow-sdk';

import { getTokenInfo } from '../utils';

interface Props {
    chainName: string;
    account: Address;
    amount: string;
    receiver?: Address;

    inputToken: Address;
    outputToken: Address;
}

export async function postSwapOrder(
    { chainName, account, amount, receiver = account, inputToken, outputToken }: Props,
    { notify, getProvider, signMessages }: FunctionOptions,
): Promise<FunctionReturn> {
    // Check wallet connection
    if (!account) return toResult('Wallet not connected', true);

    // Validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Protocol is not supported on ${chainName}`, true);
    if (outputToken == inputToken) return toResult('outputToken and inputToken must be distinct from each other', true);

    const provider = getProvider(chainId);

    const inputTokenInfo = await getTokenInfo(inputToken, provider);
    if (!inputTokenInfo) return toResult('Invalid ERC20 for inputToken', true);

    const outputTokenInfo = await getTokenInfo(outputToken, provider);
    if (!outputTokenInfo) return toResult('Invalid ERC20 for inputToken', true);

    // Validate amount
    if (Number(amount) <= 0) return toResult('amount must be greater than 0', true);

    await notify('Preparing swap order...');

    const amountParsed = parseUnits(amount, inputTokenInfo.decimals);
    if (!signMessages) return toResult('Missing parameter `signMessage`', true);

    // TODO: approve input Token

    const signer = new HeyAnonSigner(account, provider, signMessages);
    const orderBookApi = new OrderBookApi({ chainId: chainId as number });

    const quoteRequest: OrderQuoteRequest = {
        sellToken: inputToken,
        buyToken: outputToken,
        from: account,
        receiver,
        sellAmountBeforeFee: amountParsed.toString(),
        kind: OrderQuoteSideKindSell.SELL,
    };

    const { quote } = await orderBookApi.getQuote(quoteRequest);
    const orderSigningResult = await OrderSigningUtils.signOrder({ ...quote, receiver }, chainId as number, signer);
    const orderUid = await orderBookApi.sendOrder({
        ...quote,
        signature: orderSigningResult.signature,
        signingScheme: orderSigningResult.signingScheme as string as SigningScheme,
    });

    return toResult(
        `Successfully posted the order to swap ${parseUnits(quote.sellAmount, inputTokenInfo.decimals)} ${inputTokenInfo.symbol} to ${parseUnits(quote.buyAmount, outputTokenInfo.decimals)} ${outputTokenInfo.symbol} with orderUid of ${orderUid}.`,
    );
}

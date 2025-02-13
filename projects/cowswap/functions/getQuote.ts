import { FunctionOptions, FunctionReturn, getChainFromName, toResult } from '@heyanon/sdk';
import { Address, parseUnits, formatUnits } from 'viem';
import { supportedChains } from '../constants';
import { OrderBookApi, OrderQuoteRequest, OrderQuoteSideKindSell } from '@cowprotocol/cow-sdk';
import { getTokenInfo } from '../utils';

interface Props {
    chainName: string;
    account: Address;
    amount: string;
    sellToken: Address;
    buyToken: Address;
}

export async function getQuote({ chainName, account, sellToken, buyToken, amount }: Props, { getProvider }: FunctionOptions): Promise<FunctionReturn> {
    // Check wallet connection
    if (!account) return toResult('Wallet not connected', true);

    // Validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Protocol is not supported on ${chainName}`, true);

    const provider = getProvider(chainId);

    const sellTokenInfo = await getTokenInfo(sellToken, provider);
    if (!sellTokenInfo) return toResult('Invalid ERC20 for `buyToken`', true);
    const buyTokenInfo = await getTokenInfo(buyToken, provider);
    if (!buyTokenInfo) return toResult('Invalid ERC20 for `sellToken`', true);

    const orderBookApi = new OrderBookApi({ chainId: chainId as number });

    const request: OrderQuoteRequest = {
        from: account,
        kind: OrderQuoteSideKindSell.SELL,
        sellAmountAfterFee: parseUnits(amount, sellTokenInfo.decimals).toString(),
        sellToken,
        buyToken,
    };

    const { quote } = await orderBookApi.getQuote(request);
    const buyAmount = formatUnits(BigInt(quote.buyAmount), buyTokenInfo.decimals);
    const sellAmount = formatUnits(BigInt(quote.sellAmount), sellTokenInfo.decimals);

    return toResult(JSON.stringify({ buyAmount, sellAmount }));
}

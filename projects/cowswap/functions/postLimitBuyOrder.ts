import { FunctionReturn, toResult, getChainFromName, FunctionOptions } from '@heyanon/sdk';
import { Address, parseUnits } from 'viem';
import { HeyAnonSigner, supportedChains } from '../constants';
import { LimitOrderParameters, OrderKind, TradingSdk } from '@cowprotocol/cow-sdk';
import { getTokenInfo } from '../utils';

interface Props {
    chainName: string;
    account: Address;

    sellToken: Address;
    sellTokenPrice: string;
    buyTokenAmount: string;
    buyTokenPrice: string;
    buyToken: Address;
}

export async function postLimitBuyOrder(
    { chainName, account, sellToken, buyToken, buyTokenPrice, sellTokenPrice, buyTokenAmount }: Props,
    { signMessages, getProvider }: FunctionOptions,
): Promise<FunctionReturn> {
    // Check wallet connection
    if (!account) return toResult('Wallet not connected', true);

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

    const signer = new HeyAnonSigner(account, provider, signMessages);
    const sdk = new TradingSdk({
        chainId: chainId as number,
        signer,
        appCode: 'HeyAnon',
    });

    const sellTokenPriceBN = parseUnits(sellTokenPrice, 18);
    const buyTokenPriceBN = parseUnits(buyTokenPrice, 18);

    const buyTokenAmountBN = parseUnits(buyTokenAmount, buyTokenInfo.decimals);
    const sellTokenAmountBN = (sellTokenPriceBN / buyTokenPriceBN) * buyTokenAmountBN;

    const parameters: LimitOrderParameters = {
        kind: OrderKind.BUY,
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

    const result = await sdk.postLimitOrder(parameters);
    return toResult(`Successfully posted limit order ${result}`);
}

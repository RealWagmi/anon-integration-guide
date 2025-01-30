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
    sellTokenAmount: string;
    buyTokenPrice: string;
    buyToken: Address;
}

export async function postLimitSellOrder(
    { chainName, account, sellToken, buyToken, buyTokenPrice, sellTokenPrice, sellTokenAmount }: Props,
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
    const buyTokenAmount = ((parseFloat(buyTokenPrice) / parseFloat(sellTokenPrice)) * parseFloat(sellTokenAmount)).toString();

    const parameters: LimitOrderParameters = {
        kind: OrderKind.SELL,
        sellToken,
        sellTokenDecimals: sellTokenInfo.decimals,
        buyToken,
        buyTokenDecimals: buyTokenInfo.decimals,
        sellAmount: parseUnits(sellTokenAmount, sellTokenInfo.decimals).toString(),
        buyAmount: parseUnits(buyTokenAmount, buyTokenInfo.decimals).toString(),
        chainId: chainId as number,
        signer,
        appCode: 'HeyAnon',
    };

    const result = await sdk.postLimitOrder(parameters);
    return toResult(`Successfully posted limit order ${result}`);
}

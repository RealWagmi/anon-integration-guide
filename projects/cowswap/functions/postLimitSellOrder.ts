import { FunctionReturn, toResult, getChainFromName, FunctionOptions, checkToApprove } from '@heyanon/sdk';
import { Address, parseUnits } from 'viem';
import { HeyAnonSigner, supportedChains } from '../constants';
import { COW_PROTOCOL_VAULT_RELAYER_ADDRESS, LimitOrderParameters, OrderKind, TradingSdk } from '@cowprotocol/cow-sdk';
import { getTokenInfo } from '../utils';

interface Props {
    chainName: string;
    account: Address;
    slippageInPercentage: string;

    sellToken: Address;
    sellTokenPrice: string;
    sellTokenAmount: string;
    buyTokenPrice: string;
    buyToken: Address;
}

export async function postLimitSellOrder(
    { chainName, account, sellToken, buyToken, buyTokenPrice, sellTokenPrice, sellTokenAmount, slippageInPercentage }: Props,
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

    const sellTokenAmountBN = parseUnits(sellTokenAmount, sellTokenInfo.decimals);
    const buyTokenAmountBN = (buyTokenPriceBN / sellTokenPriceBN) * sellTokenAmountBN;

    await checkToApprove({
        args: {
            account,
            target: sellToken,
            spender: COW_PROTOCOL_VAULT_RELAYER_ADDRESS[chainId],
            amount: sellTokenAmountBN,
        },
        transactions: [],
        provider,
    });

    const parameters: LimitOrderParameters = {
        kind: OrderKind.SELL,
        sellToken,
        slippageBps: parseFloat(slippageInPercentage) * 100,
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

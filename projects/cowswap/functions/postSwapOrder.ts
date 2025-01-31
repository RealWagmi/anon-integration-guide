import { Address, parseUnits } from 'viem';
import { FunctionReturn, FunctionOptions, toResult, getChainFromName, checkToApprove } from '@heyanon/sdk';
import { HeyAnonSigner, supportedChains } from '../constants';
import { COW_PROTOCOL_VAULT_RELAYER_ADDRESS, TradingSdk, TradeParameters, OrderKind } from '@cowprotocol/cow-sdk';

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
    if (!signMessages) return toResult('Missing parameter `signMessages`', true);

    // Approve inputToken
    await checkToApprove({
        args: {
            account,
            target: inputToken,
            spender: COW_PROTOCOL_VAULT_RELAYER_ADDRESS[chainId],
            amount: amountParsed,
        },
        transactions: [],
        provider,
    });

    const signer = new HeyAnonSigner(account, provider, signMessages);
    const sdk = new TradingSdk({
        chainId: chainId as number,
        signer,
        appCode: 'HeyAnon',
    });

    const parameters: TradeParameters = {
        kind: OrderKind.BUY,
        sellToken: inputToken,
        sellTokenDecimals: inputTokenInfo.decimals,
        buyToken: outputToken,
        buyTokenDecimals: outputTokenInfo.decimals,
        amount: amountParsed.toString(),
    };

    const orderId = await sdk.postSwapOrder(parameters);

    return toResult(`Successfully created swap order ${orderId}`);
}

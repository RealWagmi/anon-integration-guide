import { Address } from 'viem';
import { FunctionOptions, FunctionReturn, toResult, getChainFromName } from '@heyanon/sdk';
import { HeyAnonSigner, supportedChains } from '../constants';
import { OrderBookApi, OrderSigningUtils } from '@cowprotocol/cow-sdk';

interface Props {
    chainName: string;
    account: Address;
    orderUids: string[];
}

export async function cancelOrder({ chainName, account, orderUids }: Props, { getProvider, signMessages }: FunctionOptions): Promise<FunctionReturn> {
    // Check wallet connection
    if (!account) return toResult('Wallet not connected', true);

    // Validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Protocol is not supported on ${chainName}`, true);

    if (!signMessages) return toResult('Missing parameter `signMessages`', true);

    const provider = getProvider(chainId);
    const signer = new HeyAnonSigner(account, provider, signMessages);
    const orderBookApi = new OrderBookApi({ chainId: chainId as number });

    const orderCancellationSigningResult = await OrderSigningUtils.signOrderCancellations(orderUids, chainId as number, signer);
    await orderBookApi.sendSignedOrderCancellations({
        ...orderCancellationSigningResult,
        orderUids,
    });

    return toResult(`Successfully cancelled the orderUids ${orderUids}`);
}

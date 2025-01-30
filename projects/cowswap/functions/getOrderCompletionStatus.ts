import { FunctionReturn, getChainFromName, toResult } from '@heyanon/sdk';
import { Address } from 'viem';
import { supportedChains } from '../constants';
import { OrderBookApi } from '@cowprotocol/cow-sdk';

interface Props {
    chainName: string;
    account: Address;
    orderUid: string;
}

export async function getOrderCompletionStatus({ chainName, account, orderUid }: Props): Promise<FunctionReturn> {
    // Check wallet connection
    if (!account) return toResult('Wallet not connected', true);

    // Validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Protocol is not supported on ${chainName}`, true);

    const orderBookApi = new OrderBookApi({ chainId: chainId as number });

    const orderStatus = await orderBookApi.getOrderCompetitionStatus(orderUid);

    return toResult(JSON.stringify({ status: orderStatus }));
}

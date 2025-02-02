import { Address, encodeFunctionData } from 'viem';
import { FunctionOptions, FunctionReturn, toResult, getChainFromName, TransactionParams } from '@heyanon/sdk';
import { supportedChains } from '../constants';
import { COW_PROTOCOL_SETTLEMENT_CONTRACT_ADDRESS } from '@cowprotocol/cow-sdk';
import { cowswapSettlementAbi } from '../abis/cowswap_settlement_abi';

interface Props {
    chainName: string;
    account: Address;
    orderUids: string[];
}

export async function cancelOrders({ chainName, account, orderUids }: Props, { sendTransactions }: FunctionOptions): Promise<FunctionReturn> {
    // Check wallet connection
    if (!account) return toResult('Wallet not connected', true);

    // Validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Protocol is not supported on ${chainName}`, true);

    const transactions: TransactionParams[] = [];

    for (const orderUid of orderUids) {
        transactions.push({
            target: COW_PROTOCOL_SETTLEMENT_CONTRACT_ADDRESS[chainId] as `0x{string}`,
            data: encodeFunctionData({
                abi: cowswapSettlementAbi,
                functionName: 'invalidateOrder',
                args: [orderUid],
            }),
        });
    }

    await sendTransactions({
        account,
        chainId,
        transactions,
    });

    return toResult(`Successfully cancelled the orderUids ${orderUids}`);
}

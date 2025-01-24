import { FunctionOptions, FunctionReturn, toResult, TransactionParams } from '@heyanon/sdk';
import { Address, encodeFunctionData } from 'viem';
import igniteAbi from '../abis/ignite';
import { IGNITE_ADDRESS } from '../constants';
import { parseWallet } from '../utils';

type Props = {
    chainName: string;
    account: Address;
    nodeId: string;
};

/**
 * To be called after the validation period has expired and the staker wants to redeem their deposited tokens and potential rewards.
 * @param props - The function `Props`
 * @param tools - System tools for blockchain interactions
 * @returns Transaction result
 */
export async function redeemAfterExpiry(props: Props, { sendTransactions, notify }: FunctionOptions): Promise<FunctionReturn> {
    const wallet = parseWallet(props);

    if (!wallet.success) {
        return toResult(wallet.errorMessage, true);
    }

    const { account, chainId } = wallet.data;
    const { nodeId } = props;

    if (typeof nodeId !== 'string') return toResult('Invalid node id', true);

    const transactions: TransactionParams[] = [];

    await notify('Preparing redeemAfterExpiry transaction...');

    const tx: TransactionParams = {
        target: IGNITE_ADDRESS,
        data: encodeFunctionData({
            abi: igniteAbi,
            functionName: 'redeemAfterExpiry',
            args: [nodeId],
        }),
    };

    transactions.push(tx);

    await notify('Waiting for transaction confirmation...');

    // Sign and send transaction
    const result = await sendTransactions({ chainId, account, transactions });
    const message = result.data[result.data.length - 1];

    return toResult(result.isMultisig ? message.message : `Successfully redeemed tokens for node ${nodeId}. ${message.message}`);
}

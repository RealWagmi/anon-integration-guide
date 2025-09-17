import { Address, encodeFunctionData } from 'viem';
import { FunctionReturn, toResult, EVM, FunctionOptions, EvmChain } from '@heyanon/sdk';
import { supportedChains, STS_ADDRESS } from '../constants';
import { stsAbi } from '../abis';
import { getOpenWithdrawRequests } from '../helpers/withdrawals';

interface Props {
    chainName: string;
    account: Address;
}

/**
 * Withdraws Sonic tokens (S) for every withdrawal request that is ready to be claimed,
 * in one single transaction.
 *
 * @param {Object} props - The function input parameters
 * @param {string} props.chainName - Name of the blockchain network
 * @param {Address} props.account - The user address whose claimable requests will be withdrawn
 * @param {FunctionOptions} context - Holds EVM utilities and a notifier
 * @returns {Promise<FunctionReturn>} A message detailing the result of withdrawing all claimable requests
 */
export async function withdrawAll({ chainName, account }: Props, { evm: { sendTransactions }, notify, evm: { getProvider } }: FunctionOptions): Promise<FunctionReturn> {
    const chainId = EVM.utils.getChainFromName(chainName as EvmChain);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Beets protocol is not supported on ${chainName}`, true);

    const publicClient = getProvider(chainId);

    await notify('Checking for claimable withdrawals...');

    const claimableWithdrawals = await getOpenWithdrawRequests(account, publicClient, true);

    if (claimableWithdrawals.length === 0) {
        return toResult(`No withdrawals ready to be claimed`);
    }

    const withdrawIds = claimableWithdrawals.map((w) => BigInt(w.id));
    const totalAmount = claimableWithdrawals.reduce((sum, w) => sum + Number(w.amount), 0);

    const transactions: EVM.types.TransactionParams[] = [];
    const tx: EVM.types.TransactionParams = {
        target: STS_ADDRESS,
        data: encodeFunctionData({
            abi: stsAbi,
            functionName: 'withdrawMany',
            args: [withdrawIds, false], // emergency hardcoded to false
        }),
    };
    transactions.push(tx);

    await notify(`Sending transaction to withdraw ${claimableWithdrawals.length} requests...`);

    const result = await sendTransactions({ chainId, account, transactions });
    const message = result.data[result.data.length - 1].message;
    return toResult(result.isMultisig ? message : `Successfully withdrew ${totalAmount} S from ${claimableWithdrawals.length} requests. ${message}`);
}

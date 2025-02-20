import { Address, encodeFunctionData } from 'viem';
import { FunctionReturn, toResult, EVM, FunctionOptions, EvmChain } from '@heyanon/sdk';
import { supportedChains, STS_ADDRESS } from '../constants';
import { stsAbi } from '../abis';
import { getWithdrawRequestInfo } from '../helpers/withdrawals';

interface Props {
    chainName: string;
    account: Address;
    withdrawId: string;
}

export async function withdraw({ chainName, account, withdrawId }: Props, { evm: { sendTransactions }, notify, evm: { getProvider } }: FunctionOptions): Promise<FunctionReturn> {
    const chainId = EVM.utils.getChainFromName(chainName as EvmChain);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Beets protocol is not supported on ${chainName}`, true);

    const publicClient = getProvider(chainId);

    await notify(`Preparing to claim the withdraw request with ID ${withdrawId}...`);

    const withdrawRequest = await getWithdrawRequestInfo(Number(withdrawId), publicClient);

    if (!withdrawRequest) {
        return toResult(`Withdraw request with ID ${withdrawId} does not exist; try asking for your withdraw requests`, true);
    }

    if (withdrawRequest.user !== account) {
        return toResult(`Withdraw request with ID ${withdrawId} does not belong to you; try asking for your withdraw requests`, true);
    }

    if (withdrawRequest.isWithdrawn) {
        return toResult(`Withdraw request with ID ${withdrawId} has already been claimed`, true);
    }

    if (!withdrawRequest.isReady) {
        return toResult(`Withdraw request with ID ${withdrawId} is not ready to be claimed; try again in ${withdrawRequest.timeRemaining}`, true);
    }

    const transactions: EVM.types.TransactionParams[] = [];
    const tx: EVM.types.TransactionParams = {
        target: STS_ADDRESS,
        data: encodeFunctionData({
            abi: stsAbi,
            functionName: 'withdraw',
            args: [BigInt(withdrawId), false], // emergency hardcoded to false
        }),
    };
    transactions.push(tx);

    await notify('Sending transaction...');

    const result = await sendTransactions({ chainId, account, transactions });
    const message = result.data[result.data.length - 1].message;
    return toResult(result.isMultisig ? message : `Successfully withdrew ${withdrawRequest.amount} S. ${message}`);
}

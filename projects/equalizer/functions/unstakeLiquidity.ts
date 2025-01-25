import { Address, encodeFunctionData } from 'viem';
import { FunctionReturn, FunctionOptions, TransactionParams, toResult, getChainFromName } from '@heyanon/sdk';
import { supportedChains } from '../constants';
import { gaugeAbi } from '../abis/gaugeAbi';

interface Props {
    chainName: string;
    account: Address;
    gaugeAddress: Address;
    amount: string;
}

export async function unstakeLiquidity({ chainName, account, gaugeAddress, amount }: Props, { sendTransactions, notify }: FunctionOptions): Promise<FunctionReturn> {
    if (!account) return toResult('Wallet not connected', true);

    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Equalizer is not supported on ${chainName}`, true);

    if (!gaugeAddress) return toResult('Gauge address is required', true);

    const amountBn = BigInt(amount);
    if (amountBn <= 0n) return toResult('Amount must be greater than 0', true);

    await notify('Preparing to unstake liquidity...');

    const transactions: TransactionParams[] = [];

    const unstakeTx: TransactionParams = {
        target: gaugeAddress,
        data: encodeFunctionData({
            abi: gaugeAbi,
            functionName: 'withdraw',
            args: [amountBn],
        }),
    };
    transactions.push(unstakeTx);

    await notify('Waiting for transaction confirmation...');

    const result = await sendTransactions({ chainId, account, transactions });
    const unstakeMessage = result.data[result.data.length - 1];

    return toResult(result.isMultisig ? unstakeMessage.message : `Successfully unstaked liquidity. ${unstakeMessage.message}`);
}

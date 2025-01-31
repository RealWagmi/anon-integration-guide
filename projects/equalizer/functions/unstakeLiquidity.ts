import { Address, encodeFunctionData, getAddress, parseUnits } from 'viem';
import { FunctionReturn, FunctionOptions, TransactionParams, toResult, getChainFromName } from '@heyanon/sdk';
import { supportedChains } from '../constants';
import { gaugeAbi } from '../abis/gaugeAbi';
import { getMinimalPairs } from '../lib/api/pairs';

interface Props {
    chainName: string;
    account: Address;
    lpAddress: Address;
    amount: string;
}

export async function unstakeLiquidity({ chainName, account, amount, lpAddress }: Props, { sendTransactions, notify }: FunctionOptions): Promise<FunctionReturn> {
    if (!account) return toResult('Wallet not connected', true);

    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Equalizer is not supported on ${chainName}`, true);

    if (!lpAddress) return toResult('LP address is required', true);

    const minimalPairs = await getMinimalPairs();

    const lp = minimalPairs.get(getAddress(lpAddress));

    if (!lp) return toResult(`Couldn't find LP with address ${lpAddress}`, true);

    if (!lp.gauge?.address) return toResult(`Couldn't find gauge for LP with address ${lpAddress}`, true);

    const amountBn = parseUnits(amount, 18);
    if (amountBn <= 0n) return toResult('Amount must be greater than 0', true);

    await notify('Preparing to unstake liquidity...');

    const transactions: TransactionParams[] = [];

    const unstakeTx: TransactionParams = {
        target: getAddress(lp.gauge.address),
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

import { Address, encodeFunctionData, parseUnits } from 'viem';
import { FunctionReturn, FunctionOptions, TransactionParams, toResult, getChainFromName, checkToApprove } from '@heyanon/sdk';
import { supportedChains, STS_ADDRESS } from '../constants';
import { stsAbi } from '../abis';

interface Props {
    chainName: string;
    account: Address;
    amount: string;
}

/**
 * Stake Sonic tokens (S) in Beets.fi liquid staking module
 */
export async function stake({ chainName, account, amount }: Props, { sendTransactions, getProvider, notify }: FunctionOptions): Promise<FunctionReturn> {
    if (!account) return toResult('Wallet not connected', true);

    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Beets protocol is not supported on ${chainName}`, true);

    await notify(`Preparing to stake ${amount} S...`);

    const amountInWei = parseUnits(amount, 18);
    if (amountInWei === 0n) return toResult('Amount must be greater than 0', true);
    if (amountInWei < parseUnits('0.01', 18)) return toResult('Amount must be greater than 0.01 S', true);

    const transactions: TransactionParams[] = [];

    // Prepare stake transaction
    const tx: TransactionParams = {
        target: STS_ADDRESS,
        data: encodeFunctionData({
            abi: stsAbi,
            functionName: 'deposit',
            args: [],
        }),
        value: amountInWei,
    };
    transactions.push(tx);

    await notify('Sending transaction...');

    const result = await sendTransactions({ chainId, account, transactions });
    const message = result.data[result.data.length - 1].message;
    return toResult(result.isMultisig ? message : `Successfully staked ${amount} S. ${message}`);
}

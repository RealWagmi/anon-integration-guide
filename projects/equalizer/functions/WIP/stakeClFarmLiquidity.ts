import { Address, encodeFunctionData } from 'viem';
import { FunctionReturn, FunctionOptions, TransactionParams, toResult, getChainFromName } from '@heyanon/sdk';
import { supportedChains } from '../../constants';
import { clFarmAbi } from '../../abis/clFarmAbi';

interface Props {
    chainName: string;
    account: Address;
    farmAddress: Address;
    amount: string;
}

export async function stakeClFarmLiquidity({ chainName, account, farmAddress, amount }: Props, { sendTransactions, notify }: FunctionOptions): Promise<FunctionReturn> {
    if (!account) return toResult('Wallet not connected', true);

    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Equalizer is not supported on ${chainName}`, true);

    if (!farmAddress) return toResult('Farm address is required', true);

    const amountBn = BigInt(amount);
    if (amountBn <= 0n) return toResult('Amount must be greater than 0', true);

    await notify('Preparing to stake CL Farm liquidity...');

    const transactions: TransactionParams[] = [];

    const stakeTx: TransactionParams = {
        target: farmAddress,
        data: encodeFunctionData({
            abi: clFarmAbi,
            functionName: 'deposit',
            args: [amountBn],
        }),
    };
    transactions.push(stakeTx);

    await notify('Waiting for transaction confirmation...');

    const result = await sendTransactions({ chainId, account, transactions });
    const stakeMessage = result.data[result.data.length - 1];

    return toResult(result.isMultisig ? stakeMessage.message : `Successfully staked CL Farm liquidity. ${stakeMessage.message}`);
}

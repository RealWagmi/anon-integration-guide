import { Address, parseUnits, formatUnits, encodeFunctionData } from 'viem';
import { FunctionReturn, FunctionOptions, TransactionParams, toResult, getChainFromName } from '@heyanon/sdk';
import { supportedChains, SILO_BORROWABLE_STS_DEPOSIT_ADDRESS } from '../constants';
import { siloAbi } from '../abis';

interface Props {
    chainName: string;
    account: Address;
    amount: string;
}

export async function withdrawSTS({ chainName, account, amount }: Props, { sendTransactions, notify, getProvider }: FunctionOptions): Promise<FunctionReturn> {
    if (!account) return toResult('Wallet not connected', true);

    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Silo protocol is not supported on ${chainName}`, true);

    const amountInWei = parseUnits(amount, 18);
    if (amountInWei === 0n) return toResult('Amount must be greater than 0', true);

    const provider = getProvider(chainId);
    const maxWithdrawAmount = (await provider.readContract({
        abi: siloAbi,
        address: SILO_BORROWABLE_STS_DEPOSIT_ADDRESS,
        functionName: 'maxWithdraw',
        args: [account],
    })) as bigint;

    if (maxWithdrawAmount < amountInWei) {
        return toResult(`Insufficient withdraw amount. Have ${formatUnits(maxWithdrawAmount, 18)}, want to withdraw ${amount}`, true);
    }

    await notify('Preparing to withdraw stS tokens from Silo...');

    const collateralType = 1;
    const tx: TransactionParams = {
        target: SILO_BORROWABLE_STS_DEPOSIT_ADDRESS,
        data: encodeFunctionData({
            abi: siloAbi,
            functionName: 'withdraw',
            args: [amountInWei, account, account, collateralType],
        }),
    };

    await notify('Waiting for transaction confirmation...');

    const result = await sendTransactions({ chainId, account, transactions: [tx] });
    const withdrawMessage = result.data[result.data.length - 1];

    return toResult(result.isMultisig ? withdrawMessage.message : `Successfully withdrawn ${amount} stS from Silo. ${withdrawMessage.message}`);
}

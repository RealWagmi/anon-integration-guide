import { Address, encodeFunctionData, createPublicClient, http } from 'viem';
import { FunctionReturn, FunctionOptions, TransactionParams, toResult, getChainFromName } from '@heyanon/sdk';
import { supportedChains } from '../../constants';
import { clFarmGuardAbi } from '../../abis/clFarmGuardAbi';

interface Props {
    chainName: string;
    account: Address;
    guardAddress: Address;
    wrapperAddress: Address;
    vdepAddress: Address;
    amount: string;
}

export async function redeemClFarmLiquidityFromGuard(
    { chainName, account, guardAddress, wrapperAddress, vdepAddress, amount }: Props,
    { sendTransactions, notify, getProvider }: FunctionOptions
): Promise<FunctionReturn> {
    if (!account) return toResult('Wallet not connected', true);

    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Equalizer is not supported on ${chainName}`, true);

    if (!guardAddress) return toResult('Guard address is required', true);
    if (!wrapperAddress) return toResult('Wrapper address is required', true);
    if (!vdepAddress) return toResult('VDEP address is required', true);

    const amountBn = BigInt(amount);
    if (amountBn <= 0n) return toResult('Amount must be greater than 0', true);

    await notify('Preparing to redeem CL Farm liquidity...');

    const provider = getProvider(chainId);
    const { result: withdrawResult } = await provider.simulateContract({
        address: guardAddress,
        abi: clFarmGuardAbi,
        functionName: 'forwardWithdrawFromICHIVault',
        args: [wrapperAddress, vdepAddress, amountBn, account, 0n, 0n],
        account,
    });

    const min0 = (withdrawResult[0] * 998n) / 1000n;
    const min1 = (withdrawResult[1] * 998n) / 1000n;

    const transactions: TransactionParams[] = [];

    const redeemTx: TransactionParams = {
        target: guardAddress,
        data: encodeFunctionData({
            abi: clFarmGuardAbi,
            functionName: 'forwardWithdrawFromICHIVault',
            args: [wrapperAddress, vdepAddress, amountBn, account, min0, min1],
        }),
    };
    transactions.push(redeemTx);

    await notify('Waiting for transaction confirmation...');

    const result = await sendTransactions({ chainId, account, transactions });
    const redeemMessage = result.data[result.data.length - 1];

    return toResult(result.isMultisig ? redeemMessage.message : `Successfully redeemed CL Farm liquidity. ${redeemMessage.message}`);
}

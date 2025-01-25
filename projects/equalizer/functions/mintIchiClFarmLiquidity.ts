import { Address, encodeFunctionData } from 'viem';
import { FunctionReturn, FunctionOptions, TransactionParams, toResult, getChainFromName } from '@heyanon/sdk';
import { supportedChains } from '../constants';
import { clFarmGuardAbi } from '../abis/clFarmGuardAbi';

interface Props {
    chainName: string;
    account: Address;
    guardAddress: Address;
    ichiTokenAddress: Address;
    mintToken0Address: Address;
    vdepAddress: Address;
    amount: string;
}

export async function mintIchiClFarmLiquidity(
    { chainName, account, guardAddress, ichiTokenAddress, mintToken0Address, vdepAddress, amount }: Props,
    { sendTransactions, notify }: FunctionOptions
): Promise<FunctionReturn> {
    if (!account) return toResult('Wallet not connected', true);

    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Equalizer is not supported on ${chainName}`, true);

    if (!guardAddress) return toResult('Guard address is required', true);
    if (!ichiTokenAddress) return toResult('ICHI token address is required', true);
    if (!mintToken0Address) return toResult('Token0 address is required', true);
    if (!vdepAddress) return toResult('VDEP address is required', true);

    const amountBn = BigInt(amount);
    if (amountBn <= 0n) return toResult('Amount must be greater than 0', true);

    await notify('Preparing to mint ICHI CL Farm liquidity...');

    const transactions: TransactionParams[] = [];

    const mintTx: TransactionParams = {
        target: guardAddress,
        data: encodeFunctionData({
            abi: clFarmGuardAbi,
            functionName: 'forwardDepositToICHIVault',
            args: [ichiTokenAddress, vdepAddress, mintToken0Address, amountBn, 1n, account],
        }),
    };
    transactions.push(mintTx);

    await notify('Waiting for transaction confirmation...');

    const result = await sendTransactions({ chainId, account, transactions });
    const mintMessage = result.data[result.data.length - 1];

    return toResult(result.isMultisig ? mintMessage.message : `Successfully minted ICHI CL Farm liquidity. ${mintMessage.message}`);
}

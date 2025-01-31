import { Address, encodeFunctionData } from 'viem';
import { FunctionReturn, FunctionOptions, TransactionParams, toResult, getChainFromName } from '@heyanon/sdk';
import { supportedChains } from '../../constants';
import { routerAbi } from '../../abis/routerAbi';

interface Props {
    chainName: string;
    account: Address;
    routerAddress: Address;
    token0Address: Address;
    token1Address: Address;
    stable: boolean;
    sendAmount: string;
    sendAmount0Min: string;
    sendAmount1Min: string;
    deadline: number;
}

export async function withdrawLiquidity(
    { chainName, account, routerAddress, token0Address, token1Address, stable, sendAmount, sendAmount0Min, sendAmount1Min, deadline }: Props,
    { sendTransactions, notify }: FunctionOptions
): Promise<FunctionReturn> {
    if (!account) return toResult('Wallet not connected', true);

    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Equalizer is not supported on ${chainName}`, true);

    if (!routerAddress) return toResult('Router address is required', true);
    if (!token0Address) return toResult('Token0 address is required', true);
    if (!token1Address) return toResult('Token1 address is required', true);

    const sendAmountBn = BigInt(sendAmount);
    const sendAmount0MinBn = BigInt(sendAmount0Min);
    const sendAmount1MinBn = BigInt(sendAmount1Min);

    if (sendAmountBn <= 0n) return toResult('Send amount must be greater than 0', true);

    await notify('Preparing to withdraw liquidity...');

    const transactions: TransactionParams[] = [];

    const withdrawTx: TransactionParams = {
        target: routerAddress,
        data: encodeFunctionData({
            abi: routerAbi,
            functionName: 'removeLiquidity',
            args: [token0Address, token1Address, stable, sendAmountBn, sendAmount0MinBn, sendAmount1MinBn, account, BigInt(deadline)],
        }),
    };
    transactions.push(withdrawTx);

    await notify('Waiting for transaction confirmation...');

    const result = await sendTransactions({ chainId, account, transactions });
    const withdrawMessage = result.data[result.data.length - 1];

    return toResult(result.isMultisig ? withdrawMessage.message : `Successfully withdrew liquidity. ${withdrawMessage.message}`);
}

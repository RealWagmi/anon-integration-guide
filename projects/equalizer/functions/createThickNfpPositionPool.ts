import { Address, encodeFunctionData } from 'viem';
import { FunctionReturn, FunctionOptions, TransactionParams, toResult, getChainFromName } from '@heyanon/sdk';
import { supportedChains } from '../constants';
import { checkToApprove } from '@heyanon/sdk';

interface Props {
    chainName: string;
    account: Address;
    token0Address: Address;
    token1Address: Address;
    fee: number;
    tickLower: number;
    tickUpper: number;
    amount0Desired: string;
    amount1Desired: string;
    amount0Min: string;
    amount1Min: string;
    deadline?: number;
    nfpManagerAddress: Address;
}

export async function createThickNfpPosition(
    {
        chainName,
        account,
        token0Address,
        token1Address,
        fee,
        tickLower,
        tickUpper,
        amount0Desired,
        amount1Desired,
        amount0Min,
        amount1Min,
        deadline = Math.floor(Date.now() / 1000) + 1200,
        nfpManagerAddress,
    }: Props,
    { sendTransactions, notify, getProvider }: FunctionOptions
): Promise<FunctionReturn> {
    if (!account) return toResult('Wallet not connected', true);

    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Equalizer is not supported on ${chainName}`, true);

    await notify('Preparing to create Thick NFT position...');

    const provider = getProvider(chainId);
    const transactions: TransactionParams[] = [];

    const amount0DesiredBn = BigInt(amount0Desired);
    const amount1DesiredBn = BigInt(amount1Desired);

    await checkToApprove({
        args: {
            account,
            target: token0Address,
            spender: nfpManagerAddress,
            amount: amount0DesiredBn,
        },
        provider,
        transactions,
    });

    await checkToApprove({
        args: {
            account,
            target: token1Address,
            spender: nfpManagerAddress,
            amount: amount1DesiredBn,
        },
        provider,
        transactions,
    });

    const params = {
        token0: token0Address,
        token1: token1Address,
        fee: BigInt(fee),
        tickLower: BigInt(tickLower),
        tickUpper: BigInt(tickUpper),
        amount0Desired: amount0DesiredBn,
        amount1Desired: amount1DesiredBn,
        amount0Min: BigInt(amount0Min),
        amount1Min: BigInt(amount1Min),
        recipient: account,
        deadline: BigInt(deadline),
    };

    const mintTx: TransactionParams = {
        target: nfpManagerAddress,
        data: encodeFunctionData({
            abi: thickNfpPositionMintAbi,
            functionName: 'mint',
            args: [params],
        }),
    };
    transactions.push(mintTx);

    await notify('Waiting for transaction confirmation...');

    const result = await sendTransactions({ chainId, account, transactions });
    const mintMessage = result.data[result.data.length - 1];

    return toResult(result.isMultisig ? mintMessage.message : `Successfully created Thick NFT position. ${mintMessage.message}`);
}

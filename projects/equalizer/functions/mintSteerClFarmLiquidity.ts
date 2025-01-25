import { Address, encodeFunctionData } from 'viem';
import { FunctionReturn, FunctionOptions, TransactionParams, toResult, getChainFromName } from '@heyanon/sdk';
import { supportedChains } from '../constants';

const depositAbi = [
    {
        inputs: [
            { internalType: 'uint256', name: 'amount0Desired', type: 'uint256' },
            { internalType: 'uint256', name: 'amount1Desired', type: 'uint256' },
            { internalType: 'uint256', name: 'amount0Min', type: 'uint256' },
            { internalType: 'uint256', name: 'amount1Min', type: 'uint256' },
            { internalType: 'address', name: 'to', type: 'address' },
        ],
        name: 'deposit',
        outputs: [
            { internalType: 'uint256', name: 'shares', type: 'uint256' },
            { internalType: 'uint256', name: 'amount0Used', type: 'uint256' },
            { internalType: 'uint256', name: 'amount1Used', type: 'uint256' },
        ],
        stateMutability: 'nonpayable',
        type: 'function',
    },
] as const;

interface Props {
    chainName: string;
    account: Address;
    vaultAddress: Address;
    mintToken0Amount: string;
    mintToken1Amount: string;
}

export async function mintSteerClFarmLiquidity(
    { chainName, account, vaultAddress, mintToken0Amount, mintToken1Amount }: Props,
    { sendTransactions, notify }: FunctionOptions
): Promise<FunctionReturn> {
    if (!account) return toResult('Wallet not connected', true);

    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Equalizer is not supported on ${chainName}`, true);

    if (!vaultAddress) return toResult('Vault address is required', true);

    const mintToken0AmountBn = BigInt(mintToken0Amount);
    const mintToken1AmountBn = BigInt(mintToken1Amount);

    if (mintToken0AmountBn <= 0n || mintToken1AmountBn <= 0n) return toResult('Mint amounts must be greater than 0', true);

    await notify('Preparing to mint Steer CL Farm liquidity...');

    const transactions: TransactionParams[] = [];

    const mintTx: TransactionParams = {
        target: vaultAddress,
        data: encodeFunctionData({
            abi: depositAbi,
            functionName: 'deposit',
            args: [mintToken0AmountBn, mintToken1AmountBn, 1n, 1n, account],
        }),
    };
    transactions.push(mintTx);

    await notify('Waiting for transaction confirmation...');

    const result = await sendTransactions({ chainId, account, transactions });
    const mintMessage = result.data[result.data.length - 1];

    return toResult(result.isMultisig ? mintMessage.message : `Successfully minted Steer CL Farm liquidity. ${mintMessage.message}`);
}

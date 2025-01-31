import { Abi, Address, encodeFunctionData } from 'viem';
import { FunctionReturn, FunctionOptions, TransactionParams, toResult, getChainFromName } from '@heyanon/sdk';
import { supportedChains } from '../../constants';

type ClFarmAlmType = 'Fertilizer' | 'Steer' | 'Gamma';

interface Props {
    chainName: string;
    account: Address;
    vaultAddress: Address;
    amount: string;
    functionName: 'withdraw' | 'withdrawAll';
    alm: ClFarmAlmType;
}

export async function redeemClFarmLiquidityFromVault(
    { chainName, account, vaultAddress, amount, functionName = 'withdraw', alm }: Props,
    { sendTransactions, notify }: FunctionOptions
): Promise<FunctionReturn> {
    if (!account) return toResult('Wallet not connected', true);

    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Equalizer is not supported on ${chainName}`, true);

    if (!vaultAddress) return toResult('Vault address is required', true);

    const amountBn = BigInt(amount);
    if (amountBn <= 0n) return toResult('Amount must be greater than 0', true);

    await notify('Preparing to redeem CL Farm liquidity...');

    const transactions: TransactionParams[] = [];
    let args: unknown[];
    let abi: Abi;

    switch (alm) {
        case 'Fertilizer':
            args = [amountBn, 1n, 1n];
            abi = [
                {
                    inputs: [
                        { internalType: 'uint256', name: '_shr', type: 'uint256' },
                        { internalType: 'uint256', name: '_m0', type: 'uint256' },
                        { internalType: 'uint256', name: '_m1', type: 'uint256' },
                    ],
                    name: 'withdraw',
                    outputs: [
                        { internalType: 'uint256', name: '_us0', type: 'uint256' },
                        { internalType: 'uint256', name: '_us1', type: 'uint256' },
                    ],
                    stateMutability: 'nonpayable',
                    type: 'function',
                },
            ] as const;
            break;
        case 'Steer':
            args = [amountBn, 1n, 1n, account];
            abi = [
                {
                    inputs: [
                        { internalType: 'uint256', name: 'shares', type: 'uint256' },
                        { internalType: 'uint256', name: 'amount0Min', type: 'uint256' },
                        { internalType: 'uint256', name: 'amount0Min1', type: 'uint256' },
                        { internalType: 'address', name: 'to', type: 'address' },
                    ],
                    name: 'withdraw',
                    outputs: [
                        { internalType: 'uint256', name: 'amount0', type: 'uint256' },
                        { internalType: 'uint256', name: 'amount1', type: 'uint256' },
                    ],
                    stateMutability: 'nonpayable',
                    type: 'function',
                },
            ] as const;
            break;
        case 'Gamma':
            args = [amountBn, account, account, [0n, 0n, 0n, 0n]];
            abi = [
                {
                    inputs: [
                        { internalType: 'uint256', name: 'shares', type: 'uint256' },
                        { internalType: 'address', name: 'to', type: 'address' },
                        { internalType: 'address', name: 'from', type: 'address' },
                        { internalType: 'uint256[4]', name: 'minAmounts', type: 'uint256[4]' },
                    ],
                    name: 'withdraw',
                    outputs: [
                        { internalType: 'uint256', name: 'amount0', type: 'uint256' },
                        { internalType: 'uint256', name: 'amount1', type: 'uint256' },
                    ],
                    stateMutability: 'nonpayable',
                    type: 'function',
                },
            ] as const;
            break;
        default:
            return toResult(`Unsupported ALM type: ${alm}`, true);
    }

    const redeemTx: TransactionParams = {
        target: vaultAddress,
        data: encodeFunctionData({
            abi,
            functionName,
            args,
        }),
    };
    transactions.push(redeemTx);

    await notify('Waiting for transaction confirmation...');

    const result = await sendTransactions({ chainId, account, transactions });
    const redeemMessage = result.data[result.data.length - 1];

    return toResult(result.isMultisig ? redeemMessage.message : `Successfully redeemed ${alm} CL Farm liquidity. ${redeemMessage.message}`);
}

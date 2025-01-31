import { Address, encodeFunctionData } from 'viem';
import { FunctionReturn, FunctionOptions, TransactionParams, toResult, getChainFromName } from '@heyanon/sdk';
import { supportedChains } from '../../constants';

const depositAbi = [
    {
        inputs: [
            { internalType: 'uint256', name: 'deposit0', type: 'uint256' },
            { internalType: 'uint256', name: 'deposit1', type: 'uint256' },
            { internalType: 'address', name: 'to', type: 'address' },
            { internalType: 'address', name: 'pos', type: 'address' },
            { internalType: 'uint256[4]', name: 'minIn', type: 'uint256[4]' },
        ],
        name: 'deposit',
        outputs: [{ internalType: 'uint256', name: 'shares', type: 'uint256' }],
        stateMutability: 'nonpayable',
        type: 'function',
    },
] as const;

interface Props {
    chainName: string;
    account: Address;
    guardAddress: Address;
    vaultAddress: Address;
    mintToken0Amount: string;
    mintToken1Amount: string;
}

/**
 * Mints Gamma CL Farm liquidity position
 * @param props - The minting parameters
 * @param options - System tools for blockchain interactions
 * @returns Transaction result
 */
export async function mintGammaClFarmLiquidity(
    { chainName, account, guardAddress, vaultAddress, mintToken0Amount, mintToken1Amount }: Props,
    { sendTransactions, notify }: FunctionOptions
): Promise<FunctionReturn> {
    // Check wallet connection
    if (!account) return toResult('Wallet not connected', true);

    // Validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Equalizer is not supported on ${chainName}`, true);

    // Validate addresses and amounts
    if (!guardAddress) return toResult('Guard address is required', true);
    if (!vaultAddress) return toResult('Vault address is required', true);

    const mintToken0AmountBn = BigInt(mintToken0Amount);
    const mintToken1AmountBn = BigInt(mintToken1Amount);

    if (mintToken0AmountBn <= 0n || mintToken1AmountBn <= 0n) return toResult('Mint amounts must be greater than 0', true);

    await notify('Preparing to mint Gamma CL Farm liquidity...');

    const transactions: TransactionParams[] = [];

    const mintTx: TransactionParams = {
        target: guardAddress,
        data: encodeFunctionData({
            abi: depositAbi,
            functionName: 'deposit',
            args: [mintToken0AmountBn, mintToken1AmountBn, account, vaultAddress, [0n, 0n, 0n, 0n]],
        }),
    };
    transactions.push(mintTx);

    await notify('Waiting for transaction confirmation...');

    const result = await sendTransactions({ chainId, account, transactions });
    const mintMessage = result.data[result.data.length - 1];

    return toResult(result.isMultisig ? mintMessage.message : `Successfully minted Gamma CL Farm liquidity. ${mintMessage.message}`);
}

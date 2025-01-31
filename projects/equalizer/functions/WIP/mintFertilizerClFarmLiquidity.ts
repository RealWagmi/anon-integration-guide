import { Address, encodeFunctionData } from 'viem';
import { FunctionReturn, FunctionOptions, TransactionParams, toResult, getChainFromName } from '@heyanon/sdk';
import { supportedChains } from '../../constants';

const depositAbi = [
    {
        inputs: [
            {
                internalType: 'uint256',
                name: '_a0',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: '_a1',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: '_msh',
                type: 'uint256',
            },
        ],
        name: 'deposit',
        outputs: [
            {
                internalType: 'uint256',
                name: '_shares',
                type: 'uint256',
            },
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
    slippage: string;
}

/**
 * Mints Fertilizer CL Farm liquidity position
 * @param props - The minting parameters
 * @param options - System tools for blockchain interactions
 * @returns Transaction result
 */
export async function mintFertilizerClFarmLiquidity(
    { chainName, account, vaultAddress, mintToken0Amount, mintToken1Amount, slippage }: Props,
    { sendTransactions, notify }: FunctionOptions
): Promise<FunctionReturn> {
    // Check wallet connection
    if (!account) return toResult('Wallet not connected', true);

    // Validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Equalizer is not supported on ${chainName}`, true);

    // Validate addresses and amounts
    if (!vaultAddress) return toResult('Vault address is required', true);

    const mintToken0AmountBn = BigInt(mintToken0Amount);
    const mintToken1AmountBn = BigInt(mintToken1Amount);
    const slippageBn = BigInt(slippage);

    if (mintToken0AmountBn <= 0n || mintToken1AmountBn <= 0n) return toResult('Mint amounts must be greater than 0', true);
    if (slippageBn < 0n) return toResult('Slippage cannot be negative', true);

    await notify('Preparing to mint Fertilizer CL Farm liquidity...');

    const transactions: TransactionParams[] = [];

    const mintTx: TransactionParams = {
        target: vaultAddress,
        data: encodeFunctionData({
            abi: depositAbi,
            functionName: 'deposit',
            args: [mintToken0AmountBn, mintToken1AmountBn, slippageBn],
        }),
    };
    transactions.push(mintTx);

    await notify('Waiting for transaction confirmation...');

    const result = await sendTransactions({ chainId, account, transactions });
    const mintMessage = result.data[result.data.length - 1];

    return toResult(result.isMultisig ? mintMessage.message : `Successfully minted Fertilizer CL Farm liquidity. ${mintMessage.message}`);
}

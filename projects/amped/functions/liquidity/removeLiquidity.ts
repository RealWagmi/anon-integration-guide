import { parseUnits, encodeFunctionData, Abi, Address } from 'viem';
import { 
    FunctionReturn, 
    FunctionOptions, 
    toResult,
    ChainId,
    checkToApprove,
    TransactionParams
} from '@heyanon/sdk';
import { CONTRACT_ADDRESSES, NETWORKS, CHAIN_IDS } from '../../constants';
import GLPManagerABI from '../../abis/GLPManager.json';

export interface RemoveLiquidityProps {
    chainName: 'sonic';
    account: string;
    tokenOut: string;
    amount: string;
    minOut: string;
}

/**
 * Removes liquidity from the GLP pool
 * @param {RemoveLiquidityProps} props - The properties for removing liquidity
 * @param {FunctionOptions} options - The function options
 * @returns {Promise<FunctionReturn>} The transaction result
 */
export async function removeLiquidity(
    { chainName, account, tokenOut, amount, minOut }: RemoveLiquidityProps,
    { notify, getProvider, sendTransactions }: FunctionOptions
): Promise<FunctionReturn> {
    // Input validation
    if (!chainName || !account || !tokenOut || !amount || !minOut) {
        return toResult('Missing required parameters');
    }
    if (!Object.values(NETWORKS).includes(chainName)) {
        return toResult(`Network ${chainName} not supported`);
    }

    await notify('Preparing to remove liquidity...');
    try {
        const publicClient = getProvider(chainName as unknown as ChainId);
        const amountInWei = parseUnits(amount, 18);
        const minOutInWei = parseUnits(minOut, 18);

        const transactions: TransactionParams[] = [];

        // Check if GLP token needs to be approved
        await checkToApprove({
            args: {
                account: account as Address,
                target: CONTRACT_ADDRESSES[chainName].GLP_TOKEN as Address,
                spender: CONTRACT_ADDRESSES[chainName].GLP_MANAGER as Address,
                amount: amountInWei
            },
            provider: publicClient,
            transactions
        });

        // Prepare transaction to remove liquidity
        const tx: TransactionParams = {
            target: CONTRACT_ADDRESSES[chainName].GLP_MANAGER as Address,
            data: encodeFunctionData({
                abi: GLPManagerABI.abi as Abi,
                functionName: 'removeLiquidity',
                args: [tokenOut as Address, amountInWei, minOutInWei, account as Address]
            })
        };
        transactions.push(tx);

        // Send transaction
        const result = await sendTransactions({ 
            chainId: CHAIN_IDS[chainName],
            account: account as Address,
            transactions
        });
        return toResult('Successfully removed liquidity');
    } catch (error) {
        return toResult(`Failed to remove liquidity: ${error.message}`);
    }
} 
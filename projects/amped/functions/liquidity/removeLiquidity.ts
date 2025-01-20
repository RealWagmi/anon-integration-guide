import { parseUnits, encodeFunctionData } from 'viem';
import { 
    FunctionReturn, 
    FunctionOptions, 
    TransactionParams, 
    toResult, 
    checkToApprove 
} from '@heyanon/sdk';
import { NETWORK_CONFIGS, RemoveLiquidityProps } from './types';
import GLPManagerABI from '../abis/GLPManager.json';

/**
 * Removes liquidity from the GLP pool
 * @param {RemoveLiquidityProps} props - The properties for removing liquidity
 * @param {string} props.chainName - The name of the chain
 * @param {string} props.account - The account address
 * @param {string} props.tokenOut - The token address to receive
 * @param {string} props.amount - The amount of GLP to remove
 * @param {string} props.minOut - The minimum amount of tokens to receive
 * @param {FunctionOptions} options - The function options
 * @returns {Promise<FunctionReturn>} The transaction result
 */
export async function removeLiquidity({ 
    chainName, 
    account, 
    tokenOut,
    amount,
    minOut
}: RemoveLiquidityProps, 
{ sendTransactions, notify }: FunctionOptions): Promise<FunctionReturn> {
    if (!chainName || !account || !tokenOut || !amount || !minOut) {
        return toResult('Missing required parameters', false);
    }
    const network = NETWORK_CONFIGS[chainName];
    if (!network) {
        return toResult(`Network ${chainName} not supported`, false);
    }
    const amountInWei = parseUnits(amount, 18);
    const minOutWei = parseUnits(minOut, 18);
    const transactions: TransactionParams[] = [];
    await notify('Checking GLP token approval...');
    const approvalTx = await checkToApprove(network.glpToken, account, amountInWei, network.glpManager);
    if (approvalTx) {
        await notify('Approval needed. Please confirm the approval transaction...');
        transactions.push(approvalTx);
    }
    const removeLiquidityTx: TransactionParams = {
        target: network.glpManager,
        data: encodeFunctionData({
            abi: GLPManagerABI,
            functionName: 'removeLiquidity',
            args: [tokenOut, amountInWei, minOutWei, account]
        })
    };
    transactions.push(removeLiquidityTx);
    await notify('Please confirm the liquidity removal transaction...');
    const result = await sendTransactions({ chainId: network.chainId, account, transactions });
    const message = result.data[result.data.length - 1];
    return toResult(
        result.isMultisig 
            ? message.message 
            : `Successfully removed liquidity of ${amount} GLP. ${message.message}`
    );
} 
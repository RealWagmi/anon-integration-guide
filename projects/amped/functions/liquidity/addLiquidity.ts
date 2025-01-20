import { parseUnits, encodeFunctionData } from 'viem';
import { 
    FunctionReturn, 
    FunctionOptions, 
    TransactionParams, 
    toResult, 
    checkToApprove,
    NETWORK_CONFIGS
} from '@heyanon/sdk';
import { AddLiquidityProps } from './types';
import GLPManagerABI from '../../abis/GLPManager.json';

/**
 * Adds liquidity to the GLP pool
 * @param {AddLiquidityProps} props - The properties for adding liquidity
 * @param {string} props.chainName - The name of the chain
 * @param {string} props.account - The account address
 * @param {string} props.tokenIn - The token address to provide
 * @param {string} props.amount - The amount of tokens to provide
 * @param {string} props.minOut - The minimum amount of GLP to receive
 * @param {FunctionOptions} options - The function options
 * @returns {Promise<FunctionReturn>} The transaction result
 */
export async function addLiquidity({ 
    chainName, 
    account, 
    tokenIn,
    amount,
    minOut
}: AddLiquidityProps, 
{ sendTransactions, notify }: FunctionOptions): Promise<FunctionReturn> {
    if (!chainName || !account || !tokenIn || !amount || !minOut) {
        return toResult('Missing required parameters', false);
    }
    const network = NETWORK_CONFIGS[chainName];
    if (!network) {
        return toResult(`Network ${chainName} not supported`, false);
    }
    const amountInWei = parseUnits(amount, 18);
    const minOutWei = parseUnits(minOut, 18);
    const transactions: TransactionParams[] = [];
    await notify('Checking token approval...');
    const approvalTx = await checkToApprove(tokenIn, account, amountInWei, network.glpManager);
    if (approvalTx) {
        await notify('Approval needed. Please confirm the approval transaction...');
        transactions.push(approvalTx);
    }
    const addLiquidityTx: TransactionParams = {
        target: network.glpManager,
        data: encodeFunctionData({
            abi: GLPManagerABI,
            functionName: 'addLiquidity',
            args: [tokenIn, amountInWei, minOutWei, account]
        })
    };
    transactions.push(addLiquidityTx);
    await notify('Please confirm the liquidity addition transaction...');
    const result = await sendTransactions({ chainId: network.chainId, account, transactions });
    const message = result.data[result.data.length - 1];
    return toResult(
        result.isMultisig 
            ? message.message 
            : `Successfully added liquidity with ${amount} tokens. ${message.message}`
    );
}
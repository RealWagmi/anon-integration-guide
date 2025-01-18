import { Address, encodeFunctionData, parseUnits } from 'viem';
import { getChainFromName, checkToApprove, toResult, type FunctionReturn, type FunctionOptions, type TransactionParams } from '@heyanon/sdk';
import { supportedChains } from '../../constants';
import { marketAbi } from '../../abis';

interface Props {
    chainName: string;
    account: Address;
    marketAddress: Address;
    tokenIn: Address[];
    amounts: string[];
    minLpOut: string;
}

export async function addLiquidity(
    { chainName, account, marketAddress, tokenIn, amounts, minLpOut }: Props,
    { sendTransactions, notify, getProvider }: FunctionOptions
): Promise<FunctionReturn> {
    try {
        if (!account) return toResult('Wallet not connected', true);

        const chainId = getChainFromName(chainName);
        if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);

        validateChain(chainId);

        const provider = getProvider(chainId);
        const transactions: TransactionParams[] = [];

        // Add rest of implementation...

        return toResult('Successfully added liquidity');
    } catch (error) {
        return toResult(handleError(error), true);
    }
} 

function validateChain(chainId: number) {
    throw new Error('Function not implemented.');
}


function handleError(error: unknown): string {
    throw new Error('Function not implemented.');
}

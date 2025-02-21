import { EVM, FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { Address } from 'viem';
import axios from 'axios';
//import { MIN_ERC20_ABI } from '../abis/erc20Abi';
import { HYPERSONIC_ROUTER } from '../constants';
import { validateAndGetTokenDetails, validateWallet } from '../utils';

interface Props {
    chainName: string;
    account: Address;
    inToken: string;
    outToken: string;
    inAmount: string;
}

const { checkToApprove } = EVM.utils;

/**
 * Execute a token swap on Hypersonic DEX aggregator.
 * 
 * @param props - Swap parameters including tokens, amount and account
 * @param options - System tools for blockchain interactions
 * @returns Swap result containing the transaction hash
 */
export async function swap({ chainName, account, inToken, outToken, inAmount }: Props, options: FunctionOptions): Promise<FunctionReturn> {
    const {
        evm: { getProvider, sendTransactions },
        notify,
    } = options;

    // Validate wallet
    const wallet = validateWallet({ account });
    if (!wallet.success) {
        return toResult(wallet.errorMessage, true);
    }

    // Validate input token
    const inTokenDetails = validateAndGetTokenDetails({ chainName, tokenSymbol: inToken });
    if (!inTokenDetails.success) {
        return toResult(inTokenDetails.errorMessage, true);
    }

    // Validate output token
    const outTokenDetails = validateAndGetTokenDetails({ chainName, tokenSymbol: outToken });
    if (!outTokenDetails.success) {
        return toResult(outTokenDetails.errorMessage, true);
    }

    const provider = getProvider(inTokenDetails.data.chainId);

    try {
        await notify('Getting best swap route...');

        // Get quote from Hypersonic API
        const quoteResponse = await axios.post(
            'https://api.hypersonic.exchange/v1/quote',
            {
                chainId: inTokenDetails.data.chainId,
                inToken: inTokenDetails.data.tokenAddress,
                outToken: outTokenDetails.data.tokenAddress,
                inAmount: inAmount,
                slippage: 2.5 // Using 2.5% slippage - recommended for good surfing Sonic speed 💥
            },
            {
                headers: { 'Content-Type': 'application/json' }
            }
        );

        if (!quoteResponse.data.success) {
            return toResult(`Failed to get quote: ${quoteResponse.data.error || 'Unknown error'}`, true);
        }

        await notify('Building swap transaction...');

        // Build transaction from quote
        const buildResponse = await axios.post(
            'https://api.hypersonic.exchange/v1/build',
            quoteResponse.data.data,
            {
                headers: { 'Content-Type': 'application/json' }
            }
        );

        if (!buildResponse.data.success) {
            return toResult(`Failed to build transaction: ${buildResponse.data.error || 'Unknown error'}`, true);
        }

        const transactions: EVM.types.TransactionParams[] = [];

        // Check and prepare approve transaction if needed
        await checkToApprove({
            args: {
                account,
                target: inTokenDetails.data.tokenAddress,
                spender: HYPERSONIC_ROUTER[inTokenDetails.data.chainId],
                amount: BigInt(inAmount),
            },
            provider,
            transactions,
        });

        // Add swap transaction
        const swapTx = buildResponse.data.data.transaction;
        transactions.push({
            target: swapTx.to as Address,
            data: swapTx.data,
            value: swapTx.value ? BigInt(swapTx.value) : 0n,
        });

        // Send transactions
        await notify('Executing swap...');
        const result = await sendTransactions({
            chainId: inTokenDetails.data.chainId,
            account,
            transactions,
        });

        const swapData = result.data[result.data.length - 1];

        if (result.isMultisig) {
            return toResult(swapData.message);
        }

        return toResult(
            `Successfully swapped ${inToken} for ${outToken}. ${JSON.stringify(swapData)}`
        );

    } catch (error) {
        return toResult(
            `Failed to execute swap: ${error instanceof Error ? error.message : 'Unknown error'}`,
            true
        );
    }
}
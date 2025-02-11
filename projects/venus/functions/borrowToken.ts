import { Address, encodeFunctionData, parseUnits, formatUnits } from 'viem';

import { FunctionReturn, FunctionOptions, TransactionParams, toResult } from '@heyanon/sdk';

import { vBNBAbi } from '../abis/vBNBAbi';
import { validateAndGetTokenDetails, validateWallet } from '../utils';
import { vComptrollerAbi } from '../abis/vComptrollerAbi';
import { vOrcaleABI } from '../abis/vOracleABI';
import { ORACLE_ADDRESS } from '../constants';
import { vTokenAbi } from '../abis/vTokenAbi';

interface Props {
    chainName: string;
    account: Address;
    amount: string;
    tokenSymbol: string;
    pool: string;
}

/**
 * Borrows Token using Venus protocol.
 *
 * @param props - Borrow parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Borrow result containing the transaction hash.
 */
export async function borrowToken({ chainName, account, amount, tokenSymbol, pool }: Props, { sendTransactions, notify, getProvider }: FunctionOptions): Promise<FunctionReturn> {
    const wallet = validateWallet({ account });
    if (!wallet.success) {
        return toResult(wallet.errorMessage, true);
    }
    if (!amount || typeof amount !== 'string') {
        return toResult('Invalid amount', true);
    }
    // Validate chain
    const tokenDetails = validateAndGetTokenDetails({ chainName, pool, tokenSymbol: tokenSymbol });
    if (!tokenDetails.success) {
        return toResult(tokenDetails.errorMessage, true);
    }
    const provider = getProvider(tokenDetails.data.chainId);
    try {
        await notify('Checking the borrow limit of the account...');
        const [shortfall, liquidity] = await provider.readContract({
            abi: vComptrollerAbi,
            address: tokenDetails.data.poolAddress,
            functionName: 'getAccountLiquidity',
            args: [account],
        });
        //Always 18
        const borrowLimitInUSD = parseFloat(formatUnits(liquidity, 18)).toFixed(2);
        if (borrowLimitInUSD <= 0) {
            return toResult('No available liquidity to borrow. Please supply a collateral', true);
        }

        // Handling of chain based tokens.
        let underlyingAssetAddress;
        if (tokenDetails.data.isChainBased) {
            underlyingAssetAddress = tokenDetails.data.tokenAddress;
        } else {
            underlyingAssetAddress = await provider.readContract({
                abi: vTokenAbi,
                address: tokenDetails.data.tokenAddress,
                functionName: 'underlying',
                args: [],
            });
        }
        const tokenPriceInUSD = await provider.readContract({
            abi: vOrcaleABI,
            address: ORACLE_ADDRESS,
            functionName: 'getPrice',
            args: [underlyingAssetAddress],
        });
        if (borrowLimitInUSD <= parseFloat(formatUnits(tokenPriceInUSD, 18)).toFixed(2) * amount) {
            return toResult('Not enough borrow limit please supply more', true);
        }

        await notify('Preparing to borrow Token...');
        // Prepare borrow transaction
        const borrowTx: TransactionParams = {
            target: tokenDetails.data.tokenAddress,
            data: encodeFunctionData({
                abi: vBNBAbi,
                functionName: 'borrow',
                args: [parseUnits(amount, 18)],
            }),
        };
        // Send transactions (enter borrow)
        const result = await sendTransactions({
            chainId: tokenDetails.data.chainId,
            account,
            transactions: [borrowTx],
        });
        const borrowMessage = result.data[result.data.length - 1];
        return toResult(result.isMultisig ? borrowMessage.message : `Successfully borrowed ${amount} ${tokenSymbol}.`);
    } catch (error) {
        return toResult(`Failed to borrow token: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
    }
}

import { Address, encodeFunctionData, erc20Abi, parseUnits } from 'viem';
import {
	FunctionReturn,
	FunctionOptions,
	TransactionParams,
	toResult,
	getChainFromName,
    checkToApprove
} from '@heyanon/sdk';
import { supportedChains, TOKEN } from '../constants';
import { vaultAbi, wrappedNativeAbi } from '../abis';

interface Props {
	chainName: string;
	account: Address;
	amount: string;
    token: string;
}

/**
 * Deposits asset into the Upshift partner vault.
 * @param props - The deposit parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Amount of received LP tokens.
 */
export async function depositAsset(
	{ chainName, account, amount, token }: Props,
	{ sendTransactions, notify, getProvider }: FunctionOptions
): Promise<FunctionReturn> {
	// Check wallet connection
	if (!account) return toResult('Wallet not connected', true);

    await notify('Checking everything...');

	// Validate chain
	const chainId = getChainFromName(chainName);
	if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
	if (!supportedChains.includes(chainId)) return toResult(`Upshift is not supported on ${chainName}`, true);

    // Validate token
    const tokenConfig = TOKEN[chainId][token.toUpperCase()];
    if (!tokenConfig) return toResult(`Asset is not supported`, true);

    const provider = getProvider(chainId);

    const transactions: TransactionParams[] = [];

    // Validate amount and wrapping in case native token
    let tokenAddress = tokenConfig.address;
    let amountWithDecimals;
    if (!tokenAddress) {
        const balance = await provider.getBalance({
            address: account
        });
        const amountWithDecimals = parseUnits(amount, 18);
        
        if (balance < amountWithDecimals) {
            return toResult('Amount exceeds your AVAX balance', true);
        }

        tokenAddress = tokenConfig.wrapped;
        const wrapTx: TransactionParams = {
			target: tokenAddress,
			data: encodeFunctionData({
					abi: wrappedNativeAbi,
					functionName: 'deposit',
			}),
            value: amountWithDecimals,
	    };
        transactions.push(wrapTx);
    } else {
        const decimals = await provider.readContract({
            address: tokenAddress,
            abi: erc20Abi,
            functionName: 'decimals',
        });
        amountWithDecimals = parseUnits(amount, decimals);
        if (amountWithDecimals === 0n) return toResult('Amount must be greater than 0', true);
        const balance = await provider.readContract({
            address: tokenAddress,
            abi: erc20Abi,
            functionName: 'balanceOf',
            args: [account],
        });
        if (balance < amountWithDecimals) return toResult('Amount exceeds your balance', true);
    }
    
    await notify('Depositing asset...');

    // Approve the asset beforehand
    await checkToApprove({
        args: {
            account,
            target: tokenAddress,
            spender: tokenConfig.vaultAddress,
            amount: amountWithDecimals
        },
        transactions,
        provider,
    });

	// Prepare deposit transaction
	const tx: TransactionParams = {
			target: tokenConfig.vaultAddress,
			data: encodeFunctionData({
					abi: vaultAbi,
					functionName: 'deposit',
					args: [amountWithDecimals, account],
			}),
	};
	transactions.push(tx);

	// Sign and send transaction
	const result = await sendTransactions({ chainId, account, transactions });
	const depositMessage = result.data[result.data.length - 1];

	return toResult(
        result.isMultisig ? 
        depositMessage.message : 
        `Successfully deposited ${amount} ${token} into ${tokenConfig.name} vault. You received ${depositMessage.message[-1]} ${tokenConfig.vaultSymbol}.`
    );
}
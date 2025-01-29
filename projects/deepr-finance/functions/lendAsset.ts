import { Address, encodeFunctionData, erc20Abi, parseUnits } from 'viem';
import {
	FunctionReturn,
	FunctionOptions,
	TransactionParams,
	toResult,
	getChainFromName,
	checkToApprove
} from '@heyanon/sdk';
import { supportedChains, ADDRESS } from '../constants';
import { dtokenAbi } from '../abis';

interface Props {
	chainName: string;
	account: Address;
    amount: string;
	asset: string;
}

/**
 * Lend asset to the protocol.
 * @param props - The lend parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Success message.
 */
export async function lendAsset(
	{ chainName, account, amount, asset }: Props,
	{ sendTransactions, notify, getProvider }: FunctionOptions
): Promise<FunctionReturn> {
	// Check wallet connection
	if (!account) return toResult('Wallet not connected', true);

    await notify('Checking everything...');

	// Validate chain
	const chainId = getChainFromName(chainName);
	if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
	if (!supportedChains.includes(chainId)) return toResult(`Deepr Finance is not supported on ${chainName}`, true);

    // Validate asset
    const assetConfig = ADDRESS[asset.toUpperCase()];
    if (!assetConfig) return toResult(`Asset is not supported`, true);
    const assetAddress = assetConfig.CONTRACT;
	const marketAddress = assetConfig.MARKET;

    const provider = getProvider(chainId);

    // Validate amount
    const decimals = await provider.readContract({
        address: assetAddress,
        abi: erc20Abi,
        functionName: 'decimals',
    });
    const amountWithDecimals = parseUnits(amount, decimals);
    if (amountWithDecimals === 0n) return toResult('Amount must be greater than 0', true);
    const balance = await provider.readContract({
        address: assetAddress,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [account],
    });
    if (balance < amountWithDecimals) return toResult('Amount exceeds your balance', true);

    await notify(`Lending ${asset}...`);

	const transactions: TransactionParams[] = [];

	// Approve the asset beforehand
	await checkToApprove({
		args: {
			account,
			target: assetAddress,
			spender: marketAddress,
			amount: amountWithDecimals
		},
		transactions,
		provider,
	});

	// Prepare lend transaction
	const tx: TransactionParams = {
			target: marketAddress,
			data: encodeFunctionData({
					abi: dtokenAbi,
					functionName: 'mint',
					args: [amountWithDecimals],
			}),
	};
	transactions.push(tx);

	// Sign and send transaction
	const result = await sendTransactions({ chainId, account, transactions });
	const lendMessage = result.data[result.data.length - 1];

	return toResult(
        result.isMultisig ? 
        lendMessage.message : 
        `Successfuly lent ${amount} ${asset}.`
    );
}
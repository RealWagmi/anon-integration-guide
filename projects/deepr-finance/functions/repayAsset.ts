import { Address, encodeFunctionData, erc20Abi, formatUnits, parseUnits } from 'viem';
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
 * Repay asset to the protocol.
 * @param props - The repay parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Success message.
 */
export async function repayAsset(
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
    const balanceBorrowTx: TransactionParams = {
        target: marketAddress,
        data: encodeFunctionData({
                abi: dtokenAbi,
                functionName: 'borrowBalanceCurrent',
                args: [account],
        }),
    };
    const resultBalanceBorrow = await sendTransactions({ chainId, account, transactions: [balanceBorrowTx] });
    const balanceBorrowMessage = resultBalanceBorrow.data[resultBalanceBorrow.data.length - 1];
    const balanceBorrow = BigInt(balanceBorrowMessage.message);
    const decimals = await provider.readContract({
        address: assetAddress,
        abi: erc20Abi,
        functionName: 'decimals',
    });

    await notify(`You've borrowed ${formatUnits(balanceBorrow, decimals)} ${asset}.`);

    const amountWithDecimals = parseUnits(amount, decimals);
    if (amountWithDecimals === 0n) return toResult('Amount must be greater than 0', true);
    if (balanceBorrow < amountWithDecimals) return toResult('Amount exceeds your borrow balance', true);

    await notify(`Repaying ${amount} ${asset}...`);

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

	// Prepare repay transaction
	const tx: TransactionParams = {
			target: marketAddress,
			data: encodeFunctionData({
					abi: dtokenAbi,
					functionName: 'repayBorrow',
					args: [amountWithDecimals],
			}),
	};
    transactions.push(tx);

	// Sign and send transaction
	const result = await sendTransactions({ chainId, account, transactions });
	const repayMessage = result.data[result.data.length - 1];

	return toResult(
        result.isMultisig ? 
        repayMessage.message : 
        `Successfuly repaid ${amount} ${asset}.`
    );
}
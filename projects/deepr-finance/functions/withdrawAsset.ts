import { Address, encodeFunctionData, erc20Abi, parseUnits } from 'viem';
import {
	FunctionReturn,
	FunctionOptions,
	TransactionParams,
	toResult,
	getChainFromName,
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
 * Withdraw asset from the protocol.
 * @param props - The withdraw parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Success message.
 */
export async function withdrawAsset(
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
    const marketAddress = assetConfig.MARKET;
    const assetAddress = assetConfig.CONTRACT;

    const provider = getProvider(chainId);

    // Validate amount
    const decimals = await provider.readContract({
        address: assetAddress,
        abi: erc20Abi,
        functionName: 'decimals',
    });
    const amountWithDecimals = parseUnits(amount, decimals);
    if (amountWithDecimals === 0n) return toResult('Amount must be greater than 0', true);
    const balanceTx: TransactionParams = {
        target: marketAddress,
        data: encodeFunctionData({
                abi: dtokenAbi,
                functionName: 'balanceOfUnderlying',
                args: [account],
        }),
    };
    const resultBalance = await sendTransactions({ chainId, account, transactions: [balanceTx] });
    const balanceMessage = resultBalance.data[resultBalance.data.length - 1];
    const balance = BigInt(balanceMessage.message);
    if (balance < amountWithDecimals) return toResult('Amount exceeds your balance', true);

    await notify(`Your lent balance is ${balance} ${asset}`)
    await notify(`Withdrawing ${amount} ${asset}...`);

	// Prepare withdraw transaction
	const tx: TransactionParams = {
			target: marketAddress,
			data: encodeFunctionData({
					abi: dtokenAbi,
					functionName: 'redeemUnderlying',
					args: [amountWithDecimals],
			}),
	};

	// Sign and send transaction
	const result = await sendTransactions({ chainId, account, transactions: [tx] });
	const withdrawMessage = result.data[result.data.length - 1];

	return toResult(
        result.isMultisig ? 
        withdrawMessage.message : 
        `Successfuly withdrawn ${amount} ${asset}.`
    );
}
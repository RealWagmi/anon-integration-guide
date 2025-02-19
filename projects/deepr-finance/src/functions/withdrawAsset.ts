import { Address, encodeFunctionData, maxUint256, parseUnits } from 'viem';
import { FunctionReturn, FunctionOptions, toResult, EVM, EvmChain } from '@heyanon/sdk';
import { supportedChains, TOKEN } from '../constants';
import { dtokenAbi } from '../abis';
const { getChainFromName, checkToApprove } = EVM.utils;

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
export async function withdrawAsset({ chainName, account, amount, asset }: Props, options: FunctionOptions): Promise<FunctionReturn> {
	const {
		evm: { getProvider, sendTransactions },
		notify,
	} = options;

	// Check wallet connection
	if (!account) return toResult('Wallet not connected', true);

    await notify('Checking everything...');

	// Validate chain
	const chainId = getChainFromName(chainName as EvmChain);
	if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
	if (!supportedChains.includes(chainId)) return toResult(`Deepr Finance is not supported on ${chainName}`, true);

    // Validate asset
    const assetConfig = TOKEN[asset.toUpperCase()];
    if (!assetConfig) return toResult(`Asset is not supported`, true);
    const marketAddress = assetConfig.MARKET.ADDRESS;

    const provider = getProvider(chainId);

    // Validate amount
    const decimals = assetConfig.DECIMALS;
    const amountWithDecimals = parseUnits(amount, decimals);
    if (amountWithDecimals === 0n) return toResult('Amount must be greater than 0', true);
    const balanceTx: EVM.types.TransactionParams = {
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

    const transactions: EVM.types.TransactionParams[] = [];

	// Approve the asset beforehand
	await checkToApprove({
		args: {
			account,
			target: marketAddress,
			spender: marketAddress,
			amount: maxUint256
		},
		transactions,
		provider,
	});

	// Prepare withdraw transaction
	const tx: EVM.types.TransactionParams = {
			target: marketAddress,
			data: encodeFunctionData({
					abi: dtokenAbi,
					functionName: 'redeemUnderlying',
					args: [amountWithDecimals],
			}),
	};
    transactions.push(tx);

	// Sign and send transaction
	const result = await sendTransactions({ chainId, account, transactions });
	const withdrawMessage = result.data[result.data.length - 1];

	return toResult(
        result.isMultisig ? 
        withdrawMessage.message : 
        `Successfuly withdrawn ${amount} ${asset}.`
    );
}
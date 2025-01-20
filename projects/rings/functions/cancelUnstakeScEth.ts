import { Address, encodeFunctionData, parseAbiItem } from 'viem';
import {
	FunctionReturn,
	FunctionOptions,
	TransactionParams,
	toResult,
	getChainFromName,
} from '@heyanon/sdk';
import { SCETH_SONIC_ADDRESS, STKSCETH_SONIC_WITHDRAW_ADDRESS, supportedChains } from '../constants';
import { stkscEthWithdrawQueueAbi } from '../abis';

interface Props {
	chainName: string;
	account: Address;
}

/**
 * Cancels scETH unstake from the Rings protocol.
 * @param props - The cancellation parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Success message.
 */
export async function cancelUnstakeScEth(
	{ chainName, account }: Props,
	{ sendTransactions, notify, getProvider }: FunctionOptions
): Promise<FunctionReturn> {
	// Check wallet connection
	if (!account) return toResult('Wallet not connected', true);

    await notify('Checking everything...');

	// Validate chain
	const chainId = getChainFromName(chainName);
	if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
	if (!supportedChains.includes(chainId)) return toResult(`Rings is not supported on ${chainName}`, true);

	// Getting transaction parameters from event
	const provider = getProvider(chainId);
	const logs = await provider.getLogs({  
		address: STKSCETH_SONIC_WITHDRAW_ADDRESS,
		event: parseAbiItem(`event OnChainWithdrawRequested(
			bytes32 indexed requestId,
			address indexed user, 
			address indexed assetOut, 
			uint96 nonce, 
			uint128 amountOfShares, 
			uint128 amountOfAssets, 
			uint40 creationTime, 
			uint24 secondsToMaturity, 
			uint24 secondsToDeadline)`),
		args: {
		  user: account,
		  assetOut: SCETH_SONIC_ADDRESS
		},
	});
	const { user, assetOut, nonce, amountOfShares, amountOfAssets, creationTime, secondsToMaturity, secondsToDeadline } = logs[0].args

    await notify('Sending request to cancel scETH unstake...');

	// Prepare cancel transaction
	const onChainWithdraw = [
		nonce,
		user,
		assetOut,
		amountOfShares,
		amountOfAssets,
		creationTime,
		secondsToMaturity,
		secondsToDeadline,
	];
	const tx: TransactionParams = {
			target: STKSCETH_SONIC_WITHDRAW_ADDRESS,
			data: encodeFunctionData({
					abi: stkscEthWithdrawQueueAbi,
					functionName: 'cancelOnChainWithdraw',
					args: [onChainWithdraw],
			}),
	};

	// Sign and send transaction
	const result = await sendTransactions({ chainId, account, transactions: [tx] });
	const cancelMessage = result.data[result.data.length - 1];

	return toResult(result.isMultisig ? cancelMessage.message : `Successfully cancelled unstake for scETH.`);
}
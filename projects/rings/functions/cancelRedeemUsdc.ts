import { Address, encodeFunctionData, parseAbiItem } from 'viem';
import {
	FunctionReturn,
	FunctionOptions,
	TransactionParams,
	toResult,
	getChainFromName,
} from '@heyanon/sdk';
import { SCUSD_SONIC_WITHDRAW_ADDRESS, supportedChains, USDC_ADDRESS } from '../constants';
import { scUsdWithdrawQueueAbi } from '../abis';

interface Props {
	chainName: string;
	account: Address;
}

/**
 * Cancels USDC redeem from the Rings protocol.
 * @param props - The cancellation parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Request ID.
 */
export async function cancelRedeemUsdc(
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
		address: SCUSD_SONIC_WITHDRAW_ADDRESS,
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
		  assetOut: USDC_ADDRESS
		},
	});
	const { user, assetOut, nonce, amountOfShares, amountOfAssets, creationTime, secondsToMaturity, secondsToDeadline } = logs[0].args

    await notify('Sending request to cancel USDC redeem...');

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
			target: SCUSD_SONIC_WITHDRAW_ADDRESS,
			data: encodeFunctionData({
					abi: scUsdWithdrawQueueAbi,
					functionName: 'cancelOnChainWithdraw',
					args: [onChainWithdraw],
			}),
	};

	// Sign and send transaction
	const result = await sendTransactions({ chainId, account, transactions: [tx] });
	const cancelMessage = result.data[result.data.length - 1];

	return toResult(result.isMultisig ? cancelMessage.message : `Successfully cancelled redeem for USDC.`);
}
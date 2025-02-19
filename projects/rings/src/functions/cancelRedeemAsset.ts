import { Address, encodeFunctionData, parseAbiItem } from 'viem';
import { FunctionReturn, FunctionOptions, toResult, EVM, EvmChain } from '@heyanon/sdk';
import { supportedChains, TOKEN } from '../constants';
import { scWithdrawQueueAbi } from '../abis';
const { getChainFromName } = EVM.utils;

interface Props {
	chainName: string;
	account: Address;
	asset: string;
}

/**
 * Cancels asset redeem from the Rings protocol.
 * @param props - The cancellation parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Request ID.
 */
export async function cancelRedeemAsset({ chainName, account, asset }: Props, options: FunctionOptions): Promise<FunctionReturn> {
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
	if (!supportedChains.includes(chainId)) return toResult(`Rings is not supported on ${chainName}`, true);

	// Normalize asset name to uppercase to match TOKEN keys
    const assetUpper = asset.toUpperCase();

	// Validate asset
	let tokenConfig;
	let baseAsset;
	if (['ETH', 'USD', 'BTC'].includes(assetUpper)) {
		baseAsset = assetUpper;
		tokenConfig = TOKEN[baseAsset][`SC${assetUpper}`];
	} else if (['SCETH', 'SCUSD', 'SCBTC'].includes(assetUpper)) {
		baseAsset = assetUpper.slice(2);
		tokenConfig = TOKEN[baseAsset][assetUpper];
	} else {
		return toResult(`Unsupported asset: ${asset}`, true);
	}

    const withdrawAddress = tokenConfig.withdraw;
	if (!withdrawAddress) {
		return toResult(`Unsupported asset: ${asset}`, true);
	}

    // Determine assetOut address based on base asset
    const assetOut = baseAsset === 'ETH' ? TOKEN.ETH.WETH.address : (baseAsset === 'BTC' ? TOKEN.BTC.WBTC.address : TOKEN.USD.USDC.address);

	// Getting transaction parameters from event
	const provider = getProvider(chainId);
	const logs = await provider.getLogs({  
		address: withdrawAddress,
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
		  assetOut
		},
	});

	if (logs.length === 0) {
        return toResult('No active redeem request found', true);
    }

	// Take last request
    const latestLog = logs[logs.length - 1];
    const { 
        nonce, 
        user: loggedUser, 
        assetOut: loggedAssetOut, 
        amountOfShares, 
        amountOfAssets, 
        creationTime, 
        secondsToMaturity, 
        secondsToDeadline 
    } = latestLog.args;

    await notify(`Canceling ${asset} redeem...`);

	// Prepare cancel transaction
	const onChainWithdraw = [
		nonce,
		loggedUser,
		loggedAssetOut,
		amountOfShares,
		amountOfAssets,
		creationTime,
		secondsToMaturity,
		secondsToDeadline,
	];
	const tx: EVM.types.TransactionParams = {
			target: withdrawAddress,
			data: encodeFunctionData({
					abi: scWithdrawQueueAbi,
					functionName: 'cancelOnChainWithdraw',
					args: [onChainWithdraw],
			}),
	};

	// Sign and send transaction
	const result = await sendTransactions({ chainId, account, transactions: [tx] });
	const cancelMessage = result.data[result.data.length - 1];

	return toResult(result.isMultisig ? cancelMessage.message : `Successfully cancelled ${asset} redeem.`);
}
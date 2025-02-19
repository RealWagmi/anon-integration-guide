import { Address, encodeFunctionData } from 'viem';
import { FunctionReturn, FunctionOptions, toResult, EVM, EvmChain } from '@heyanon/sdk';
import { supportedChains, TOKEN } from '../constants';
import { veAbi } from '../abis';
const { getChainFromName } = EVM.utils;

interface Props {
	chainName: string;
	account: Address;
	asset: string;
	weeks: number;
}

/**
 * Increases locked staked asset duration in the Rings protocol.
 * @param props - The extension parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Success message.
 */
export async function extendLock({ chainName, account, asset, weeks }: Props, options: FunctionOptions): Promise<FunctionReturn> {
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
	let baseAsset;
	if (['STKSCETH', 'STKSCUSD', 'STKSCBTC'].includes(assetUpper)) {
		baseAsset = assetUpper.slice(5);
	} else if (['VEETH', 'VEUSD', 'VEBTC'].includes(assetUpper)) {
		baseAsset = assetUpper.slice(2);
	} else {
		return toResult(`Unsupported asset: ${asset}`, true);
	}

	// Validate lock duration
	if (weeks < 1 || weeks > 52 || !Number.isInteger(weeks)) return toResult('Lock duration must be integer and between 1 and 52 weeks', true);

    await notify(`Extending stksc${baseAsset} lock duration...`);

	const voteAsset = TOKEN[baseAsset][`VE${baseAsset}`].address;
    
	// Prepare extension transaction
    const provider = getProvider(chainId);
    const tokenId = await provider.readContract({
        address: voteAsset,
        abi: veAbi,
        functionName: 'tokenOfOwnerByIndex',
        args: [account, 0],
    })
    if (tokenId === 0) return toResult(`No locked stksc${baseAsset}`, true);

    const lockDuration = weeks * 7 * 24 * 60 * 60;
	const tx: EVM.types.TransactionParams = {
			target: voteAsset,
			data: encodeFunctionData({
					abi: veAbi,
					functionName: 'increase_unlock_time',
					args: [tokenId, lockDuration],
			}),
	};

	// Sign and send transaction
	const result = await sendTransactions({ chainId, account, transactions: [tx] });
	const lockMessage = result.data[result.data.length - 1];

	return toResult(result.isMultisig ? lockMessage.message : `Successfully extended stksc${baseAsset} lock.`);
}
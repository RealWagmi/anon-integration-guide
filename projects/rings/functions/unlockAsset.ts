import { Address, encodeFunctionData } from 'viem';
import {
	FunctionReturn,
	FunctionOptions,
	TransactionParams,
	toResult,
	getChainFromName,
} from '@heyanon/sdk';
import { supportedChains, TOKEN } from '../constants';
import { veAbi } from '../abis';

interface Props {
	chainName: string;
	account: Address;
	asset: string;
}

/**
 * Unlocks all staked asset from the Rings protocol.
 * @param props - The unlock parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Success message.
 */
export async function unlockAsset(
	{ chainName, account, asset }: Props,
	{ sendTransactions, notify, getProvider }: FunctionOptions
): Promise<FunctionReturn> {
	// Check wallet connection
	if (!account) return toResult('Wallet not connected', true);

    await notify('Checking everything...');

	// Validate chain
	const chainId = getChainFromName(chainName);
	if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
	if (!supportedChains.includes(chainId)) return toResult(`Rings is not supported on ${chainName}`, true);

	// Normalize asset name to uppercase to match TOKEN keys
    const assetUpper = asset.toUpperCase();

	// Validate asset
	let baseAsset;
	let tokenConfig;
	if (['STKSCETH', 'STKSCUSD'].includes(assetUpper)) {
		baseAsset = assetUpper.slice(5);
		tokenConfig = TOKEN[baseAsset][`VE${assetUpper}`];
	} else if (['VEETH', 'VEUSD'].includes(assetUpper)) {
		baseAsset = assetUpper.slice(2);
		tokenConfig = TOKEN[baseAsset][assetUpper];
	} else {
		return toResult(`Unsupported asset: ${asset}`, true);
	}

    await notify(`Unlocking stksc${baseAsset}...`);

	const voteAsset = tokenConfig.address;
    
	// Prepare unlock transaction
    const provider = getProvider(chainId);
    const tokenId = await provider.readContract({
        address: voteAsset,
        abi: veAbi,
        functionName: 'tokenOfOwnerByIndex',
        args: [account, 0],
    })
    if (tokenId === 0) return toResult(`No locked stksc${baseAsset}`, true);

	const tx: TransactionParams = {
			target: voteAsset,
			data: encodeFunctionData({
					abi: veAbi,
					functionName: 'withdraw',
					args: [tokenId],
			}),
	};

	// Sign and send transaction
	const result = await sendTransactions({ chainId, account, transactions: [tx] });
	const unlockMessage = result.data[result.data.length - 1];

	return toResult(result.isMultisig ? unlockMessage.message : `Successfully unlocked stksc${baseAsset}.`);
}
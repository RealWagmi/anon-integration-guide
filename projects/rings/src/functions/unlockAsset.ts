import { Address, encodeFunctionData } from 'viem';
import { FunctionReturn, FunctionOptions, toResult, EVM, EvmChain } from '@heyanon/sdk';
import { supportedChains, TOKEN } from '../constants';
import { veAbi } from '../abis';
const { getChainFromName } = EVM.utils;

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
export async function unlockAsset({ chainName, account, asset }: Props, options: FunctionOptions): Promise<FunctionReturn> {
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
	let tokenConfig;
	if (['STKSCETH', 'STKSCUSD', 'STKSCBTC'].includes(assetUpper)) {
		baseAsset = assetUpper.slice(5);
		tokenConfig = TOKEN[baseAsset][`VE${assetUpper}`];
	} else if (['VEETH', 'VEUSD', 'VEBTC'].includes(assetUpper)) {
		baseAsset = assetUpper.slice(2);
		tokenConfig = TOKEN[baseAsset][assetUpper];
	} else {
		return toResult(`Unsupported asset: ${asset}`, true);
	}

    await notify(`Unlocking stksc${baseAsset}...`);

	const voteAssetAddress = tokenConfig.address;
    
	// Prepare unlock transaction
    const provider = getProvider(chainId);
    const tokenId = await provider.readContract({
        address: voteAssetAddress,
        abi: veAbi,
        functionName: 'tokenOfOwnerByIndex',
        args: [account, 0],
    })
    if (tokenId === 0) return toResult(`No locked stksc${baseAsset}`, true);

	const tx: EVM.types.TransactionParams = {
			target: voteAssetAddress,
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
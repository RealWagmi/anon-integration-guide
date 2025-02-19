import { Address, encodeFunctionData } from 'viem';
import { FunctionReturn, FunctionOptions, toResult, EVM, EvmChain } from '@heyanon/sdk';
import { supportedChains, TOKEN } from '../constants';
import { veAbi } from '../abis';
const { getChainFromName } = EVM.utils;

interface Props {
	chainName: string;
	account: Address;
	asset: string;
	delegatee: Address;
}

/**
 * Delegates all voting power of asset to delegatee.
 * @param props - The delegate parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Success message.
 */
export async function delegateVotesEth({ chainName, account, asset, delegatee }: Props, options: FunctionOptions): Promise<FunctionReturn> {
	const {
		evm: { sendTransactions },
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
		tokenConfig = TOKEN[baseAsset][`VE${assetUpper}`];
	} else if (['VEETH', 'VEUSD', 'VEBTC'].includes(assetUpper)) {
		baseAsset = assetUpper.slice(2);
		tokenConfig = TOKEN[baseAsset][assetUpper];
	} else {
		return toResult(`Unsupported asset: ${asset}`, true);
	}

    await notify('Delegating votes...');
    
	// Prepare delegate transaction
	const tx: EVM.types.TransactionParams = {
			target: tokenConfig.address,
			data: encodeFunctionData({
					abi: veAbi,
					functionName: 'delegate',
					args: [delegatee],
			}),
	};

	// Sign and send transaction
	const result = await sendTransactions({ chainId, account, transactions: [tx] });
	const transferMessage = result.data[result.data.length - 1];

	return toResult(result.isMultisig ? transferMessage.message : `Successfully delegated votes to ${delegatee}.`);
}
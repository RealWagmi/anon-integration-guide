import { Address, encodeFunctionData, hexToBigInt, toHex } from 'viem';
import { FunctionReturn, FunctionOptions, toResult, EVM, EvmChain} from '@heyanon/sdk';
import { supportedChains, FACTORY_ADDRESS } from '../constants';
import { factoryAbi } from '../abis';
const { getChainFromName } = EVM.utils;

interface Props {
	chainName: string;
	account: Address;
	name: string;
	symbol: string;
	description: string;
	image: string;
}

/**
 * Deploys a token with name, symbol, description and image-url.
 * @param props - The token parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Address of the token.
 */
export async function deployToken({ chainName, account, name, symbol, description, image}: Props, options: FunctionOptions): Promise<FunctionReturn> {
	const {
		evm: { getProvider, sendTransactions },
		notify,
	} = options;

	// Check wallet connection
	if (!account) return toResult('Wallet not connected', true);

	// Validate chain
	const chainId = getChainFromName(chainName as EvmChain);
	if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
	if (!supportedChains.includes(chainId)) return toResult(`Gu is not supported on ${chainName}`, true);

	// Retrieve deploying fee from storage
	const publicClient = getProvider(chainId);
	const storageSlot = await publicClient.getStorageAt({
        address: FACTORY_ADDRESS,
        slot: toHex(9),
    }) as string;
	const fee = hexToBigInt(`0x${storageSlot.slice(6, 27)}`);

	await notify('Deploying token...');

	// Prepare deploy transaction
	const tx: EVM.types.TransactionParams = {
			target: FACTORY_ADDRESS,
			data: encodeFunctionData({
					abi: factoryAbi,
					functionName: 'deploy',
					args: [name, symbol, description, image],
			}),
			value: fee,
	};
	
	// Sign and send transaction
	const result = await sendTransactions({ chainId, account, transactions: [tx] });
	const deployMessage = result.data[result.data.length - 1];

	return toResult(result.isMultisig ? deployMessage.message : `Successfully created the token at address ${deployMessage.message}`);
}


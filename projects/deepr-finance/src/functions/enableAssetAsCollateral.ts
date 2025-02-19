import { Address, encodeFunctionData } from 'viem';
import { FunctionReturn, FunctionOptions, toResult, EVM, EvmChain } from '@heyanon/sdk';
import { CONTRACT, supportedChains, TOKEN } from '../constants';
import { unitrollerAbi } from '../abis';
const { getChainFromName } = EVM.utils;

interface Props {
	chainName: string;
	account: Address;
	asset: string;
}

/**
 * Enable collateral for a given market.
 * @param props - The enable parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Success message.
 */
export async function enableAssetAsCollateral({ chainName, account, asset }: Props, options: FunctionOptions): Promise<FunctionReturn> {
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
	if (!supportedChains.includes(chainId)) return toResult(`Deepr Finance is not supported on ${chainName}`, true);

    // Validate market
    const marketAddress = TOKEN[asset.toUpperCase()].MARKET.ADDRESS;
    if (!marketAddress) return toResult(`Market is not supported`, true);

    await notify('Enabling the market as collateral...');

	// Prepare enable transaction
	const tx: EVM.types.TransactionParams = {
			target: CONTRACT.UNITROLLER,
			data: encodeFunctionData({
					abi: unitrollerAbi,
					functionName: 'enterMarkets',
					args: [[marketAddress]],
			}),
	};

	// Sign and send transaction
	const result = await sendTransactions({ chainId, account, transactions: [tx] });
	const enableMessage = result.data[result.data.length - 1];

	return toResult(
        result.isMultisig ? 
        enableMessage.message : 
        `Successfuly enabled ${asset} as collateral.`
    );
}
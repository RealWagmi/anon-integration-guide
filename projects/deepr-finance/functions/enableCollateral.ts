import { Address, encodeFunctionData } from 'viem';
import {
	FunctionReturn,
	FunctionOptions,
	TransactionParams,
	toResult,
	getChainFromName,
} from '@heyanon/sdk';
import { supportedChains, ADDRESS } from '../constants';
import { unitrollerAbi } from '../abis';

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
export async function enableCollateral(
	{ chainName, account, asset }: Props,
	{ sendTransactions, notify }: FunctionOptions
): Promise<FunctionReturn> {
	// Check wallet connection
	if (!account) return toResult('Wallet not connected', true);

    await notify('Checking everything...');

	// Validate chain
	const chainId = getChainFromName(chainName);
	if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
	if (!supportedChains.includes(chainId)) return toResult(`Deepr Finance is not supported on ${chainName}`, true);

    // Validate market
    const marketAddress = ADDRESS[asset.toUpperCase()].MARKET;
    if (!marketAddress) return toResult(`Market is not supported`, true);

    await notify('Enabling the market as collateral...');

	// Prepare enable transaction
	const tx: TransactionParams = {
			target: ADDRESS.CONTRACT.UNITROLLER as Address,
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
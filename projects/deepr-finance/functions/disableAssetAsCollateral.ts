import { Address, encodeFunctionData } from 'viem';
import {
	FunctionReturn,
	FunctionOptions,
	TransactionParams,
	toResult,
	getChainFromName,
} from '@heyanon/sdk';
import { supportedChains, TOKEN } from '../constants';
import { unitrollerAbi } from '../abis';

interface Props {
	chainName: string;
	account: Address;
	asset: string;
}

/**
 * Disable collateral for a given market.
 * @param props - The disable parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Success message.
 */
export async function disableAssetAsCollateral(
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
    const marketAddress = TOKEN[asset.toUpperCase()].MARKET;
    if (!marketAddress) return toResult(`Market is not supported`, true);

	await notify('Disabling the market as collateral...');

	// Prepare disable transaction
	const tx: TransactionParams = {
			target: TOKEN.CONTRACT.UNITROLLER as Address,
			data: encodeFunctionData({
					abi: unitrollerAbi,
					functionName: 'exitMarket',
					args: [marketAddress],
			}),
	};

	// Sign and send transaction
	const result = await sendTransactions({ chainId, account, transactions: [tx] });
	const disableMessage = result.data[result.data.length - 1];

	return toResult(
        result.isMultisig ? 
        disableMessage.message : 
        `Successfuly disabled ${asset} as collateral.`
    );
}
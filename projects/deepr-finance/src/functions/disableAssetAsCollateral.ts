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
 * Disable collateral for a given market.
 * @param props - The disable parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Success message.
 */
export async function disableAssetAsCollateral({ chainName, account, asset }: Props, options: FunctionOptions): Promise<FunctionReturn> {
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

	await notify('Disabling the market as collateral...');

	// Prepare disable transaction
	const tx: EVM.types.TransactionParams = {
			target: CONTRACT.UNITROLLER,
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
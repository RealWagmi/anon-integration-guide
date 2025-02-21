import { EVM, FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { Address, encodeFunctionData } from 'viem';
import { vComptrollerAbi } from '../abis/vComptrollerAbi';
import { validateAndGetTokenDetails, validateWallet } from '../utils';
import { getEnabledCollateral } from './getEnabledCollateral';

interface Props {
	chainName: string;
	account: Address;
	tokenSymbol: string;
	pool: string;
}

/**
 * Declare assets as collateral in Venus protocol.
 *
 * @param props - Enter market parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns result containing the transaction hash.
 */
export async function enterMarkets({ chainName, account, tokenSymbol, pool }: Props, options: FunctionOptions): Promise<FunctionReturn> {
	const {
		evm: { sendTransactions },
		notify,
	} = options;
	const wallet = validateWallet({ account });
	if (!wallet.success) {
		return toResult(wallet.errorMessage, true);
	}

	// Check if asset is already enabled as collateral
	const enabledCollateral = await getEnabledCollateral({ chainName, account, pool }, options);
	const tokenDetails = validateAndGetTokenDetails({ chainName, pool, tokenSymbol: tokenSymbol });
	if (!tokenDetails.success) return toResult(tokenDetails.errorMessage, true);

	if (enabledCollateral.success) {
		const response = JSON.parse(enabledCollateral.data);
		const isEnabled = response.enabledAssets.some((asset: { symbol: string; address: string }) => asset.address.toLowerCase() === tokenDetails.data.tokenAddress.toLowerCase());

		if (isEnabled) {
			return toResult(`${tokenSymbol} is already enabled as collateral`);
		}
	}

	try {
		await notify('Preparing to enter Market...');
		// Prepare to enter markets
		const enterMarketsTx: EVM.types.TransactionParams = {
			target: tokenDetails.data.comptroller,
			data: encodeFunctionData({
				abi: vComptrollerAbi,
				functionName: 'enterMarkets',
				args: [[tokenDetails.data.tokenAddress]],
			}),
		};
		// Send transactions
		const result = await sendTransactions({
			chainId: tokenDetails.data.chainId,
			account,
			transactions: [enterMarketsTx],
		});
		const enterData = result.data[result.data.length - 1];
		return toResult(
			result.isMultisig
				? enterData.message
				: `Successfully entered Market. You enable ${tokenSymbol} in venus ${pool} pool as collateral. Your borrow limit are increased. ${JSON.stringify(enterData)}`,
		);
	} catch (error) {
		return toResult(`Failed to enter market: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
	}
}

import { EVM, EvmChain, FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';

import { Address, formatUnits } from 'viem';
import { vComptrollerAbi } from '../abis/vComptrollerAbi';
import { POOLS, supportedChains } from '../constants';
import { validateWallet } from '../utils';
const { getChainFromName } = EVM.utils;
interface Props {
	chainName: string;
	account: Address;
	pool: string;
}

/**
 * Retrieves the Account Liquidity and Borrowing Power from the Venus protocol.
 *
 * @returns {Promise<FunctionReturn>}.
 */
export async function getAccountLiquidity({ chainName, account, pool }: Props, options: FunctionOptions): Promise<FunctionReturn> {
	const {
		evm: { getProvider },
		notify,
	} = options;
	const wallet = validateWallet({ account });
	if (!wallet.success) {
		return toResult(wallet.errorMessage, true);
	}
	// Validate chain
	const chainId = getChainFromName(chainName as EvmChain);
	if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
	const poolDetails = POOLS[pool];
	if (supportedChains.indexOf(chainId) === -1) return toResult(`Protocol is not supported on ${chainName}`, true);
	if (!poolDetails.comptroller[chainId]) {
		return toResult(`Pool ${pool} not supported on ${chainName}`, true);
	}

	try {
		const provider = getProvider(chainId);
		await notify('Getting Account Liquidity...');

		const comptroller = { abi: vComptrollerAbi, address: poolDetails.comptroller[chainId] };

		const [liquidityResult] = await provider.multicall({
			contracts: [{ ...comptroller, functionName: 'getAccountLiquidity', args: [account] }],
		});

		if (!liquidityResult.status) {
			throw new Error('Failed to fetch account data');
		}
		// console.log("liquidityResult", liquidityResult);

		// Ensure results are arrays and have expected length
		if (!Array.isArray(liquidityResult.result) || liquidityResult.result.length !== 3) {
			throw new Error('Invalid response format from contract');
		}

		// Destructure with explicit type checking based on ABI
		const [errorLiquidity, liquidity, shortfall] = liquidityResult.result as [bigint, bigint, bigint];

		// Check for errors from contract
		if (errorLiquidity !== 0n) {
			throw new Error('Contract returned error status');
		}

		const borrowLimit = parseFloat(formatUnits(liquidity, 18)).toFixed(2);
		const shortFall = parseFloat(formatUnits(shortfall, 18)).toFixed(2);

		return toResult(`Account Status in Venus ${pool} pool:\n` + `Total Borrow Limit: $${borrowLimit}\n` + `Total Shortfall: $${shortFall}\n`);
	} catch (error) {
		return toResult(`Failed to get account liquidity: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
	}
}

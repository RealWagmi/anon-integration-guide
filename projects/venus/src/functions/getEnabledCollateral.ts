import { EVM, EvmChain, FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { Address, erc20Abi } from 'viem';
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
 * Retrieves all enabled collateral assets for an account from the Venus protocol.
 *
 * @returns {Promise<FunctionReturn>} Array of enabled collateral token addresses
 */
export async function getEnabledCollateral({ chainName, account, pool }: Props, options: FunctionOptions): Promise<FunctionReturn> {
	const {
		evm: { getProvider },
		notify,
	} = options;
	// Validate wallet
	const wallet = validateWallet({ account });
	if (!wallet.success) {
		return toResult(wallet.errorMessage, true);
	}
	// Validate chain
	const chainId = getChainFromName(chainName as EvmChain);
	if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
	if (supportedChains.indexOf(chainId) === -1) return toResult(`Protocol is not supported on ${chainName}`, true);
	const poolDetails = POOLS[pool];
	if (!poolDetails.comptroller[chainId]) {
		return toResult(`Pool ${pool} not supported on ${chainName}`, true);
	}

	try {
		const provider = getProvider(chainId);
		await notify('Getting enabled collateral...');
		const comptroller = { address: poolDetails.comptroller[chainId], abi: vComptrollerAbi };

		// Create array of promises for accountAssets calls
		const enabledAssets = (await provider.readContract({
			...comptroller,
			functionName: 'getAssetsIn',
			args: [account],
		})) as Address[];

		if (enabledAssets.length === 0) {
			const response = {
				message: `No enabled collateral found for your ${account} account`,
				enabledAssets: [],
			};
			return toResult(JSON.stringify(response));
		}

		const symbols = await provider.multicall({
			contracts: enabledAssets.map((el) => ({
				address: el,
				abi: erc20Abi,
				functionName: 'symbol',
			})),
		});

		// Combine addresses with their symbols
		const assetsWithSymbols = enabledAssets.map((address, i) => ({
			symbol: symbols[i].result as string,
			address: address,
		}));
		// console.log(assetsWithSymbols);
		const response = {
			message: 'Enabled collateral found. To disable any asset, please specify the underlying asset symbol (without "v")',
			enabledAssets: assetsWithSymbols,
		};
		return toResult(JSON.stringify(response));
	} catch (error) {
		return toResult(`Failed to get enabled collateral: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
	}
}

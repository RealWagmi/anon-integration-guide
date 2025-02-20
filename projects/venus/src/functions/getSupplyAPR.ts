import { EVM, EvmChain, FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { formatUnits } from 'viem';
import { vBNBAbi } from '../abis/vBNBAbi';
import { supportedChains } from '../constants';
import { validateAndGetTokenDetails } from '../utils';
const { getChainFromName } = EVM.utils;
interface Props {
	chainName: string;
	tokenSymbol: string;
	pool: string;
}

/**
 * Retrieves the Supply APR from the Venus protocol.
 *
 * @returns {Promise<FunctionReturn>} - The Supply APR.
 */
export async function getSupplyAPR({ chainName, tokenSymbol, pool }: Props, options: FunctionOptions): Promise<FunctionReturn> {
	const {
		evm: { getProvider },
		notify,
	} = options;
	// Validate chain
	const chainId = getChainFromName(chainName as EvmChain);
	if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
	const tokenDetails = validateAndGetTokenDetails({ chainName, pool, tokenSymbol: tokenSymbol });
	if (!tokenDetails.success) {
		return toResult(tokenDetails.errorMessage, true);
	}
	if (supportedChains.indexOf(chainId) === -1) return toResult(`Protocol is not supported on ${chainName}`, true);
	try {
		const provider = getProvider(chainId);
		await notify('Getting Current Supply APR...');
		const supplyRatePerBlock = (await provider.readContract({
			abi: vBNBAbi,
			address: tokenDetails.data.tokenAddress,
			functionName: 'supplyRatePerBlock',
			args: [],
		})) as bigint;

		const blocksPerYear = tokenDetails.data.blocksPerYear;
		const supplyAPR = supplyRatePerBlock * blocksPerYear;
		//16 to get the percent as decimals is always 18 here.
		return toResult(`Supply APR for ${tokenSymbol}: ${parseFloat(formatUnits(supplyAPR, 16)).toFixed(2)}%`);
	} catch (error) {
		return toResult(`Failed to get Supply APR: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
	}
}

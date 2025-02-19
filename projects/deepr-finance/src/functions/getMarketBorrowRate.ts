import { formatUnits } from 'viem';
import { FunctionReturn, FunctionOptions, toResult, EVM, EvmChain } from '@heyanon/sdk';
import { supportedChains, TOKEN } from '../constants';
import { dtokenAbi } from '../abis';
const { getChainFromName } = EVM.utils;

interface Props {
	chainName: string;
	asset: string;
}

/**
 * Fetch borrow APY and APR.
 * @param props - The request parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Success message.
 */
export async function getMarketBorrowRate({ chainName, asset }: Props, options: FunctionOptions): Promise<FunctionReturn> {
    const {
		evm: { getProvider },
		notify,
	} = options;

    await notify('Checking everything...');

	// Validate chain
	const chainId = getChainFromName(chainName as EvmChain);
	if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
	if (!supportedChains.includes(chainId)) return toResult(`Deepr Finance is not supported on ${chainName}`, true);

    // Validate asset
    const assetConfig = TOKEN[asset.toUpperCase()];
    if (!assetConfig) return toResult(`Asset is not supported`, true);
    const marketAddress = assetConfig.MARKET.ADDRESS;

    // Accrued Interest calculation
    const provider = getProvider(chainId);

    const secondsPerDay = 86400;
    const daysPerYear = 365;

    const decimals = assetConfig.DECIMALS;

    const borrowRatePerSecond = await provider.readContract({
        address: marketAddress,
        abi: dtokenAbi,
        functionName: 'borrowRatePerSecond'
    }) as bigint;

    const borrowRatePerSecondNumber = parseFloat(formatUnits(borrowRatePerSecond, decimals));

    const borrowApr = borrowRatePerSecondNumber * (secondsPerDay * daysPerYear) * 100;

    const borrowApy =
            (Math.pow(
                (borrowRatePerSecondNumber) * secondsPerDay + 1,
                daysPerYear
            ) - 1) * 100;

	return toResult(`${asset} Borrow Market: APR - ${borrowApr}%, APY - ${borrowApy}%.`);
}
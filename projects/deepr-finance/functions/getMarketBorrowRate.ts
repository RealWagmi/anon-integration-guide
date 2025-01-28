import { Address, erc20Abi, formatUnits } from 'viem';
import {
	FunctionReturn,
	FunctionOptions,
	toResult,
	getChainFromName,
} from '@heyanon/sdk';
import { supportedChains, ADDRESS } from '../constants';
import { dtokenAbi } from '../abis';

interface Props {
	chainName: string;
	account: Address;
	asset: string;
}

/**
 * Fetch borrow APY and APR.
 * @param props - The request parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Success message.
 */
export async function gettMarketBorrowRate(
	{ chainName, account, asset }: Props,
	{ notify, getProvider }: FunctionOptions
): Promise<FunctionReturn> {
	// Check wallet connection
	if (!account) return toResult('Wallet not connected', true);

    await notify('Checking everything...');

	// Validate chain
	const chainId = getChainFromName(chainName);
	if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
	if (!supportedChains.includes(chainId)) return toResult(`Deepr Finance is not supported on ${chainName}`, true);

    // Validate asset
    const assetConfig = ADDRESS[asset.toUpperCase()];
    if (!assetConfig) return toResult(`Asset is not supported`, true);
    const marketAddress = assetConfig.MARKET;
    const assetAddress = assetConfig.CONTRACT;

    // Accrued Interest calculation
    const provider = getProvider(chainId);

    const secondsPerDay = 86400;
    const daysPerYear = 365;

    const decimals = await provider.readContract({
        address: assetAddress,
        abi: erc20Abi,
        functionName: 'decimals',
    });

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
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
 * Fetch data considering user's market activity.
 * @param props - The request parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Success message.
 */
export async function getUsersMarketPosition(
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
    const assetAddress = assetConfig.CONTRACT;
    const marketAddress = assetConfig.MARKET;

    const provider = getProvider(chainId);
    
    // Calculate borrowed and supplied
    const borrowed = await provider.readContract({
        address: marketAddress,
        abi: dtokenAbi,
        functionName: 'borrowBalanceStored',
        args: [account],
    }) as bigint;

    const dCollateral = await provider.readContract({
        address: marketAddress,
        abi: dtokenAbi,
        functionName: 'balanceOf',
        args: [account],
    }) as bigint;

    const exchangeRate = await provider.readContract({
        address: marketAddress,
        abi: dtokenAbi,
        functionName: 'exchangeRateStored',
        args: [account],
    }) as bigint;
    
    const decimals = await provider.readContract({
        address: assetAddress,
        abi: erc20Abi,
        functionName: 'decimals',
    });
    const dTokenDecimals = 8;
    const mantissa = 18 + decimals - dTokenDecimals;

    const borrowedValue = BigInt(formatUnits(borrowed, decimals));
    const collateralValue = BigInt(formatUnits(dCollateral, dTokenDecimals)) * exchangeRate / 10n ** BigInt(mantissa);


	return toResult(
        `${asset} Market:
        Supply balance ${collateralValue} ${asset};
        Borrow balance: ${borrowedValue} ${asset}.`
    );
}
import { Address, erc20Abi, formatUnits } from 'viem';
import {
	FunctionReturn,
	FunctionOptions,
	toResult,
	getChainFromName,
} from '@heyanon/sdk';
import { supportedChains, ADDRESS } from '../constants';
import { dtokenAbi, oracleAbi, unitrollerAbi } from '../abis';

interface Props {
	chainName: string;
	account: Address;
}

/**
 * Fetch user's health factor.
 * @param props - The request parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Success message.
 */
export async function getUsersHealthFactor(
	{ chainName, account }: Props,
	{ notify, getProvider }: FunctionOptions
): Promise<FunctionReturn> {
	// Check wallet connection
	if (!account) return toResult('Wallet not connected', true);

    await notify('Checking everything...');

	// Validate chain
	const chainId = getChainFromName(chainName);
	if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
	if (!supportedChains.includes(chainId)) return toResult(`Deepr Finance is not supported on ${chainName}`, true);

    const provider = getProvider(chainId);

    // Calculating health factor
    const [, liquidity, ] = await provider.readContract({
        address: ADDRESS.CONTRACT.UNITROLLER as Address,
        abi: unitrollerAbi,
        functionName: 'getAccountLiquidity',
        args: [account],
    }) as [bigint, bigint, bigint];
    const availableLiquidity = liquidity / BigInt(1e18);

    const markets = await provider.readContract({
        address: ADDRESS.CONTRACT.UNITROLLER as Address,
        abi: unitrollerAbi,
        functionName: 'getAssetsIn',
        args: [account],
    }) as Address[];

    let totalBorrowed = 0n;

    for (const market of markets) {
        const price = await provider.readContract({
            address: ADDRESS.CONTRACT.ORACLE as Address,
            abi: oracleAbi,
            functionName: 'getUnderlyingPrice',
            args: [market],
        }) as bigint;

        const borrowed = await provider.readContract({
            address: market,
            abi: dtokenAbi,
            functionName: 'borrowBalanceStored',
            args: [account],
        }) as bigint;

        const asset = await provider.readContract({
            address: market,
            abi: dtokenAbi,
            functionName: 'underlying',
        }) as Address;

        const decimals = await provider.readContract({
            address: asset,
            abi: erc20Abi,
            functionName: 'decimals',
        });

        const scaledDecimals = 10**18 * 10**(18 - decimals);
        const scaledPrice = price / BigInt(scaledDecimals);
        const scaledBorrowed = BigInt(formatUnits(borrowed, decimals));
        const borrowedValue = scaledPrice * scaledBorrowed;

        totalBorrowed += borrowedValue;
    }
    if (totalBorrowed === 0n) {
        return toResult('Health Factor: Infinity (no borrowed assets)');
    }

    const healthFactor = 1 + Number(availableLiquidity) / Number(totalBorrowed);

	return toResult(`Health Factor: ${healthFactor.toFixed(2)}. If the Health Factor reaches 1, you will be liquidated.`);
}
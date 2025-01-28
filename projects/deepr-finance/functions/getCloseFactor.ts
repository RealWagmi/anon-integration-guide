import { Address } from 'viem';
import {
	FunctionReturn,
	FunctionOptions,
	toResult,
	getChainFromName,
} from '@heyanon/sdk';
import { supportedChains, ADDRESS } from '../constants';
import { unitrollerAbi } from '../abis';

interface Props {
	chainName: string;
	account: Address;
}

/**
 * Fetch close factor to liquidate borrows.
 * @param props - The request parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Success message.
 */
export async function getCloseFactor(
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

    const closeFactorMantissa = await provider.readContract({
        address: ADDRESS.CONTRACT.UNITROLLER as Address,
        abi: unitrollerAbi,
        functionName: 'closeFactorMantissa',
    }) as bigint;

    const closeFactorPercent = closeFactorMantissa / BigInt(1e18) * 100n;

	return toResult(`Borrow will be liquidated after reaching ${closeFactorPercent}% of supplied value.`);
}
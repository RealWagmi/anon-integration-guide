import { FunctionReturn, FunctionOptions, toResult, EvmChain, EVM } from '@heyanon/sdk';
import { CONTRACT, supportedChains } from '../constants';
import { unitrollerAbi } from '../abis';
const { getChainFromName } = EVM.utils;

interface Props {
	chainName: string;
}

/**
 * Fetch close factor to liquidate borrows.
 * @param props - The request parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Success message.
 */
export async function getCloseFactor({ chainName }: Props, options: FunctionOptions): Promise<FunctionReturn> {
	const {
		evm: { getProvider },
		notify,
	} = options;

    await notify('Checking everything...');

	// Validate chain
	const chainId = getChainFromName(chainName as EvmChain);
	if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
	if (!supportedChains.includes(chainId)) return toResult(`Deepr Finance is not supported on ${chainName}`, true);

    const provider = getProvider(chainId);

    const closeFactorMantissa = await provider.readContract({
        address: CONTRACT.UNITROLLER,
        abi: unitrollerAbi,
        functionName: 'closeFactorMantissa',
    }) as bigint;

    const closeFactorPercent = closeFactorMantissa / BigInt(1e18) * 100n;

	return toResult(`Borrow will be liquidated after reaching ${closeFactorPercent}% of supplied value.`);
}
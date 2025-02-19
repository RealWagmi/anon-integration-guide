import { EVM, EvmChain } from '@heyanon/sdk';
import { Address } from 'viem';
import { BLOCKS_PER_YEAR, POOLS, supportedChains } from './constants';

const { getChainFromName } = EVM.utils;

type Result<Data> =
	| {
			success: false;
			errorMessage: string;
	  }
	| {
			success: true;
			data: Data;
	  };

export const validateWallet = <Props extends { account: Address }>({ account }: Props): Result<{ account: Address }> => {
	if (!account) return { success: false, errorMessage: 'Wallet not connected' };
	return {
		success: true,
		data: {
			account,
		},
	};
};

export const validateAndGetTokenDetails = <Props extends { chainName: string; pool: string; tokenSymbol: string }>({
	chainName,
	pool,
	tokenSymbol,
}: Props): Result<{
	chainId: number;
	comptroller: Address;
	tokenAddress: Address;
	isChainBased?: boolean;
	blocksPerYear: bigint;
}> => {
	const poolDetails = POOLS[pool];
	const chainId = getChainFromName(chainName as EvmChain);
	if (!chainId) return { success: false, errorMessage: `Unsupported chain name: ${chainName}` };
	if (supportedChains.indexOf(chainId) === -1 || !poolDetails.poolTokens[chainId]) return { success: false, errorMessage: `Protocol is not supported on ${chainName}` };
	if (!poolDetails.comptroller[chainId]) return { success: false, errorMessage: `Pool ${pool} not supported on ${chainName}` };
	const tokenDetails = poolDetails.poolTokens[chainId][tokenSymbol.toUpperCase()];
	if (!tokenDetails) return { success: false, errorMessage: `Token ${tokenSymbol} not found on chain ${chainName}` };
	const comptroller = poolDetails.comptroller[chainId];
	const tokenAddress = tokenDetails.address;
	const isChainBased = tokenDetails.chainBased;
	const blocksPerYear = BLOCKS_PER_YEAR[chainId as keyof typeof BLOCKS_PER_YEAR];
	if (!blocksPerYear) {
		return { success: false, errorMessage: `Blocks per year not configured for chain ${chainName}` };
	}
	return {
		success: true,
		data: {
			chainId,
			comptroller,
			tokenAddress,
			isChainBased,
			blocksPerYear,
		},
	};
};

export function timeConverter(UNIX_timestamp: number) {
	const a = new Date(UNIX_timestamp * 1000);
	const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
	const year = a.getFullYear();
	const month = months[a.getMonth()];
	const date = a.getDate();
	const hour = a.getHours();
	const min = a.getMinutes().toString().padStart(2, '0');
	const sec = a.getSeconds().toString().padStart(2, '0');
	const time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec;
	return time;
}

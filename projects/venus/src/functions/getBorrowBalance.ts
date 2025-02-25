import { FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { Address, erc20Abi, formatUnits } from 'viem';
import { vTokenAbi } from '../abis/vTokenAbi';
import { validateAndGetTokenDetails, validateWallet } from '../utils';

interface Props {
	chainName: string;
	account: Address;
	tokenSymbol: string;
	pool: string;
}

/**
 * Gets the current borrow balance of token from the Venus protocol.
 *
 * @returns {Promise<FunctionReturn>} - The borrow balance of Token.
 */
export async function getBorrowBalance({ chainName, account, tokenSymbol, pool }: Props, options: FunctionOptions): Promise<FunctionReturn> {
	const {
		evm: { getProvider },
	} = options;

	const wallet = validateWallet({ account });
	if (!wallet.success) {
		return toResult(wallet.errorMessage, true);
	}

	const tokenDetails = validateAndGetTokenDetails({ chainName, pool, tokenSymbol: tokenSymbol });
	if (!tokenDetails.success) {
		return toResult(tokenDetails.errorMessage, true);
	}

	const provider = getProvider(tokenDetails.data.chainId);

	try {
		let uDecimals;
		if (tokenDetails.data.isChainBased) {
			uDecimals = 18;
		} else {
			const uTokenAddress = await provider.readContract({
				abi: vTokenAbi,
				address: tokenDetails.data.tokenAddress,
				functionName: 'underlying',
				args: [],
			});
			uDecimals = await provider.readContract({
				abi: erc20Abi,
				address: uTokenAddress,
				functionName: 'decimals',
				args: [],
			});
		}

		const borrowBalanceStored = await provider.readContract({
			abi: vTokenAbi,
			address: tokenDetails.data.tokenAddress,
			functionName: 'borrowBalanceStored',
			args: [account],
		});

		return toResult(
			`[INSTRUCTION FOR AI: DO NOT ROUND BALANCE.] Current borrow balance (your debt) of ${tokenSymbol} in ${pool} pool: ${formatUnits(borrowBalanceStored, uDecimals)}`,
		);
	} catch (error) {
		return toResult(`Failed to get borrow balance: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
	}
}

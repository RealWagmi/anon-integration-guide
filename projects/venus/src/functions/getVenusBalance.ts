import { EVM, EvmChain, FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { Address, erc20Abi, formatUnits, parseEther, zeroAddress } from 'viem';
import { vBNBAbi } from '../abis/vBNBAbi';
import { vTokenAbi } from '../abis/vTokenAbi';
import { supportedChains } from '../constants';
import { validateAndGetTokenDetails, validateWallet } from '../utils';
const { getChainFromName } = EVM.utils;
interface Props {
	chainName: string;
	account: Address;
	tokenSymbol: string;
	pool: string;
}

/**
 * Retrieves the balance of underlying token from the Venus protocol.
 *
 * @returns {Promise<FunctionReturn>} - The balance of Token.
 */
export async function getVenusBalance({ chainName, account, tokenSymbol, pool }: Props, options: FunctionOptions): Promise<FunctionReturn> {
	const {
		evm: { getProvider },
		notify,
	} = options;
	const wallet = validateWallet({ account });
	if (!wallet.success) {
		return toResult(wallet.errorMessage, true);
	}
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
		if (!provider.chain) throw new Error(`Chain data not available for ${chainName}`);
		const nativeCurrency = provider.chain.nativeCurrency;
		await notify('Checking Balance of token...');
		let underlyingTokenDecimals: number;
		let underlyingTokenSymbol: string;
		let balance_vToken: { status: 'success' | 'failure'; result?: bigint; error?: Error };
		let underlyingResult: { status: 'success' | 'failure'; result?: Address; error?: Error };
		let exchangeRateResult: { status: 'success' | 'failure'; result?: bigint; error?: Error };

		if (tokenDetails.data.isChainBased) {
			const vToken = { abi: vBNBAbi, address: tokenDetails.data.tokenAddress };
			[balance_vToken, exchangeRateResult] = await provider.multicall({
				contracts: [
					{ ...vToken, functionName: 'balanceOf', args: [account] },
					{ ...vToken, functionName: 'exchangeRateStored' },
				],
			});
			if (!balance_vToken.status || !exchangeRateResult.status) {
				throw new Error('Failed to fetch token data');
			}
			underlyingTokenSymbol = nativeCurrency.symbol;
			underlyingTokenDecimals = 18;
		} else {
			const vToken = { abi: vTokenAbi, address: tokenDetails.data.tokenAddress };
			[balance_vToken, underlyingResult, exchangeRateResult] = await provider.multicall({
				contracts: [
					{ ...vToken, functionName: 'balanceOf', args: [account] },
					{ ...vToken, functionName: 'underlying' },
					{ ...vToken, functionName: 'exchangeRateStored' },
				],
			});
			if (!balance_vToken.status || !underlyingResult.status || !exchangeRateResult.status) {
				throw new Error('Failed to fetch token data');
			}
			const uTokenAdress = underlyingResult.result;
			if (!uTokenAdress || uTokenAdress === zeroAddress || uTokenAdress === '0x') {
				throw new Error('Failed to fetch uTokenAdress');
			}

			const uToken = await provider.multicall({
				contracts: ['symbol', 'decimals'].map((functionName) => ({
					address: uTokenAdress,
					abi: erc20Abi,
					functionName,
				})),
			});

			const [symbol_uToken, decimals_uToken] = uToken.map((result) => result.result) as [string, bigint];
			if (!symbol_uToken || !decimals_uToken)
				throw new Error(`Invalid ERC20 token contract at address ${uTokenAdress}. Failed to fetch token details (symbol: ${symbol_uToken}, decimals: ${decimals_uToken})`);
			underlyingTokenDecimals = Number(decimals_uToken);
			underlyingTokenSymbol = symbol_uToken;
		}

		if (!balance_vToken.status) {
			throw new Error('Failed to fetch token data');
		}

		if (!exchangeRateResult.result) {
			throw new Error('Failed to fetch exchange rate');
		}

		if (balance_vToken.result === undefined) {
			throw new Error('Failed to fetch balance');
		}

		const numerator = exchangeRateResult.result * balance_vToken.result;
		const denominator = parseEther('1');
		const amountUnderlying = numerator / denominator;

		return toResult(
			`[INSTRUCTION FOR AI: DO NOT ROUND BALANCE.] Balance of your account ${account} in Venus ${pool} pool in ${underlyingTokenSymbol} : ${formatUnits(amountUnderlying, underlyingTokenDecimals)}`,
		);
	} catch (error) {
		return toResult(`Failed to Get Balance: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
	}
}

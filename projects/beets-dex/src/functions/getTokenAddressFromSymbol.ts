import { EVM, FunctionReturn, toResult, FunctionOptions, EvmChain } from '@heyanon/sdk';
import { ALLOW_TOKEN_SYNONYMS, supportedChains } from '../constants';
import { getGqlTokenBySymbol } from '../helpers/tokens';

interface Props {
    chainName: string;
    symbol: string;
}

/**
 * Resolves a token symbol to its address on a specific chain.
 * Handles token synonyms if enabled in constants.
 *
 * @param {Object} props - The input parameters
 * @param {string} props.chainName - Name of the blockchain network
 * @param {string} props.symbol - Token symbol to look up
 * @param {FunctionOptions} options - HeyAnon SDK options, including provider and notification handlers
 * @returns {Promise<FunctionReturn>} Token address if found
 */
export async function getTokenAddressFromSymbol({ chainName, symbol }: Props, { notify }: FunctionOptions): Promise<FunctionReturn> {
    const chainId = EVM.utils.getChainFromName(chainName as EvmChain);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Chain ${chainName} is not supported`, true);

    // Look for the token with the exact symbol, or a synonym
    const token = await getGqlTokenBySymbol(chainName, symbol, true);
    if (!token) return toResult(`Token ${symbol} not found on ${chainName}`, true);
    if (symbol.toLowerCase() !== token?.symbol?.toLowerCase()) {
        if (!ALLOW_TOKEN_SYNONYMS) {
            return toResult(`Token ${symbol} not found on ${chainName}, did you mean ${token?.symbol}?`, true);
        } else {
            notify(`Token ${symbol} not found on ${chainName}, using ${token?.symbol} instead`);
        }
    }

    return toResult(token.address);
}

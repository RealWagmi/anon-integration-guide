import { EVM, FunctionReturn, toResult, EvmChain } from '@heyanon/sdk';
import { supportedChains } from '../../constants';
import { getTokenInfoFromSymbol } from '../../helpers/tokens';
interface Props {
    chainName: string;
    symbol: string;
}

/**
 * Resolves a token symbol to its address on a specific chain.
 *
 * @param {Object} props - The input parameters
 * @param {string} props.chainName - Name of the blockchain network
 * @param {string} props.symbol - Token symbol to look up
 * @returns {Promise<FunctionReturn>} Token address if found
 */
export async function getTokenAddressFromSymbol({ chainName, symbol }: Props): Promise<FunctionReturn> {
    const chainId = EVM.utils.getChainFromName(chainName as EvmChain);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Chain ${chainName} is not supported`, true);

    // Look for the token with the exact symbol, or a synonym
    const token = await getTokenInfoFromSymbol(chainName, symbol);
    if (!token) return toResult(`Token ${symbol} not found on ${chainName}`, true);
    return toResult(token.address);
}

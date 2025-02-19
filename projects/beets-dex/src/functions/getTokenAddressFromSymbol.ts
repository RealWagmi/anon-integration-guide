import { FunctionReturn, toResult, FunctionOptions, getChainFromName } from '@heyanon/sdk';
import { ALLOW_TOKEN_SYNONYMS, supportedChains } from '../constants';
import { getGqlTokenBySymbol } from '../helpers/tokens';

interface Props {
    chainName: string;
    symbol: string;
}

export async function getTokenAddressFromSymbol({ chainName, symbol }: Props, { notify }: FunctionOptions): Promise<FunctionReturn> {
    const chainId = getChainFromName(chainName);
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

import { FunctionReturn, toResult, FunctionOptions, getChainFromName } from '@heyanon/sdk';
import { supportedChains } from '../constants';
import { getTokenBySymbol } from '../helpers/tokens';

interface Props {
    chainName: string;
    symbol: string;
}

export async function getTokenAddressFromSymbol({ chainName, symbol }: Props): Promise<FunctionReturn> {
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Chain ${chainName} is not supported`, true);
    
    const token = await getTokenBySymbol(chainName, symbol);
    if (!token) return toResult(`Token ${symbol} not found on ${chainName}`, true);
    
    return toResult(token.address);
} 
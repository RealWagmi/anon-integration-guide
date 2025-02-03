import { FunctionReturn, toResult, FunctionOptions, getChainFromName } from '@heyanon/sdk';
import { supportedChains } from '../constants';
import { getTokenAddressBySymbol } from '../helpers/tokens';

interface Props {
    chainName: string;
    symbol: string;
}

export async function getTokenAddressFromSymbol({ chainName, symbol }: Props): Promise<FunctionReturn> {
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Chain ${chainName} is not supported`, true);
    
    const address = getTokenAddressBySymbol(chainName, symbol);
    if (!address) return toResult(`Token ${symbol} not found on ${chainName}`, true);
    
    return toResult(address);
} 
import { FunctionReturn, toResult, getChainName } from '@heyanon/sdk';
import { supportedChains } from '../constants';

export async function getSkySupportedChains(): Promise<FunctionReturn> {
    const skySupportedChains = supportedChains.map((chainId) => ({
        chainId,
        chainName: getChainName(chainId),
    }));

    return toResult(JSON.stringify(skySupportedChains));
}

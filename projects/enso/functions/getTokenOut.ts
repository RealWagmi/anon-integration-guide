import { FunctionReturn, toResult, getChainFromName, FunctionOptions } from '@heyanon/sdk';
import { ENSO_API_TOKEN, supportedChains } from '../constants';
import axios from 'axios';
import { Address } from 'viem';
import { EnsoClient } from '@ensofinance/sdk';

interface Props {
    chainName: string;
    project: string;
    underlyingToken: Address;
}

/**
 * Determines the token received from a project for utilizing a specific underlying token.
 * @param props - The function parameters
 */
export async function getTokenOut({ chainName, project, underlyingToken }: Props, { notify }: FunctionOptions): Promise<FunctionReturn> {
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Enso is not supported on ${chainName}`, true);

    try {
        const ensoClient = new EnsoClient({ apiKey: ENSO_API_TOKEN });
        let token = await ensoClient.getTokenData({
            chainId,
            underlyingTokens: [underlyingToken],
            project,
        });

        if (token.data.length != 1) {
            if (token.data.length === 0) {
                return toResult(`Got no results for ${project} project and ${underlyingToken} as underlying token.`, true);
            }
            await notify(`Got more than one result, fetching data for specific protocol slug...`);

            const tokenByProtocol = await ensoClient.getTokenData({
                chainId,
                underlyingTokens: [underlyingToken],
                protocolSlug: project,
            });

            if (tokenByProtocol.data.length !== 1) {
                return toResult(`Could not narrow down results for ${project} project and ${underlyingToken} as underlying token.`, true);
            }

            token = tokenByProtocol;
        }

        return toResult(`Token out for ${project} project and ${underlyingToken} as underlying token is: ${token.data[0].address}`);
    } catch (e) {
        if (axios.isAxiosError(e)) {
            return toResult(`API error: ${e.message}`, true);
        }
        return toResult(`Unknown error when fetching route from Enso API`, true);
    }
}

import axios from 'axios';
import { EVM, EvmChain, FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { supportedChains, TOKEN } from '../constants';
const { getChainFromName } = EVM.utils;

interface VaultData {
    symbol: string;
    name: string;
    totalSupply: {
        normalized: string;
    };
    apy: number;
    rewards: {
        additional_points: string[];
    }
}

interface ApiVaultResponse {
    data: VaultData[];
    status: number;
}

interface Props {
    chainName: string;
    token: string;
}

/**
 * Fetches vault's APY.
 * @param props - The request parameters. 
 * @returns APY.
 */
export async function getVaultApy({ chainName, token }: Props, { notify }: FunctionOptions): Promise<FunctionReturn> {
    await notify('Checking inputs...');

    // Validate chain
	const chainId = getChainFromName(chainName as EvmChain);
	if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
	if (!supportedChains.includes(chainId)) return toResult(`Upshift is not supported on ${chainName}`, true);

    // Validate asset
    const tokenConfig = TOKEN[chainId][token.toUpperCase()];
    if (!tokenConfig) toResult('Asset is not supported', true);
    const apiKey = tokenConfig.api;

    await notify('Searching...');
    
    const responseVault = await axios.get<ApiVaultResponse>(`https://${apiKey}.upshift.finance/api/proxy/pools`);

    // Validate response
    if (!responseVault.data?.data?.length) {
        return toResult('No vault data available', true);
    }

    const targetVault = responseVault.data.data.find(
        (vault) => vault.symbol === tokenConfig.vaultSymbol
    );
    const apyInfo = targetVault?.apy ? `APY: ${targetVault?.apy}%` : '';

    return toResult(`${targetVault?.name} ${apyInfo}`);
}
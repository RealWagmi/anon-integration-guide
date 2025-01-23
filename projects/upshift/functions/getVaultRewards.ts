import axios from 'axios';
import { FunctionOptions, FunctionReturn, getChainFromName, toResult } from '@heyanon/sdk';
import { supportedChains, TOKEN, TokenConfig } from '../constants'

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
 * Fetches vault's rewards.
 * @param props - The request parameters. 
 * @returns Rewards.
 */
export async function getVaultRewards({ chainName, token }: Props, { notify }: FunctionOptions): Promise<FunctionReturn> {
    await notify('Checking inputs...');

    // Validate chain
	const chainId = getChainFromName(chainName);
	if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
	if (!supportedChains.includes(chainId)) return toResult(`Upshift is not supported on ${chainName}`, true);

    // Validate asset
    const tokenConfig: TokenConfig = TOKEN[chainId][token.toUpperCase()];
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
    let rewardsInfo = 'No additional rewards';
    if (targetVault?.rewards?.additional_points?.length) {
        rewardsInfo = targetVault.rewards.additional_points.join(', ');
    }

    return toResult(`${targetVault?.name} rewards: ${rewardsInfo}`);
}
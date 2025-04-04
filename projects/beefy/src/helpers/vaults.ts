import { MOO_TOKEN_DECIMALS } from '../constants';
import BeefyClient, { ApyBreakdown, TvlInDollarsData, VaultInfo } from './beefyClient';
import { getBeefyChainFromBeefyChainName, isBeefyChainSupported } from './chains';
import { to$$$ } from './format';

/**
 * Vault with all relevant information, obtained by joining
 * various entities returned by the Beefy API.
 */
export interface SimplifiedVault {
    id: string;
    name: string;
    chain: string;
    assets: string[];
    totalApy: number | null;
    tvl: number | null;
    depositedTokenName: string;
    depositedTokenAddress: string;
    depositedTokenDecimals: number;
    mooTokenName: string;
    mooTokenAddress: string;
    mooTokenDecimals: number;
}

/**
 * Fetch info from the Beefy API and build a list of SimplifiedVault objects.
 *
 * Only vaults from chains in supportedChains are included.
 */
export async function getAllSimplifiedVaults(): Promise<SimplifiedVault[]> {
    const beefyClient = new BeefyClient();
    const vaults = await beefyClient.getVaults();
    const apyBreakdown = await beefyClient.getApyBreakdown();
    const tvl = await beefyClient.getTvl();
    return buildSimplifiedVaults(vaults, apyBreakdown, tvl);
}

/**
 * Given the responses from the vaults, apy/breakdown and tvl endpoints,
 * return a list of SimplifiedVault objects.
 *
 * Only vaults from chains in supportedChains are included.
 */
export function buildSimplifiedVaults(vaults: VaultInfo[], apyBreakdown: ApyBreakdown, tvl: TvlInDollarsData): SimplifiedVault[] {
    return vaults
        .filter((vault) => {
            return isBeefyChainSupported(vault.chain);
        })
        .map((vault) => {
            const chainId = getBeefyChainFromBeefyChainName(vault.chain);
            return {
                id: vault.id,
                name: vault.name,
                chain: vault.chain,
                assets: vault.assets,
                totalApy: apyBreakdown?.[vault.id]?.totalApy ?? null,
                tvl: tvl?.[chainId]?.[vault.id] ?? null,
                depositedTokenName: vault.token,
                depositedTokenAddress: vault.tokenAddress,
                depositedTokenDecimals: vault.tokenDecimals,
                mooTokenName: vault.earnedToken,
                mooTokenAddress: vault.earnedTokenAddress,
                mooTokenDecimals: MOO_TOKEN_DECIMALS,
            };
        });
}

/**
 * Given a vault returned from the Beefy API, format it into a
 * multi-line string, with just the essential information,
 * including the vault ID.
 */
export function formatVault(vault: SimplifiedVault, titlePrefix: string = ''): string {
    let parts = [];
    parts.push(`${titlePrefix}${vault.name} [${vault.assets.join('-')}]:`);
    const offset = '   ';
    if (vault.totalApy !== null) {
        parts.push(`${offset}- APY: ${(vault.totalApy * 100).toFixed(2)}%`);
    } else {
        parts.push(`${offset}- APY: N/A`);
    }
    if (vault.tvl !== null) {
        parts.push(`${offset}- TVL: ${to$$$(vault.tvl)}`);
    } else {
        parts.push(`${offset}- TVL: N/A`);
    }
    parts.push(`${offset}- Chain: ${vault.chain}`);
    parts.push(`${offset}- ID: ${vault.id}`);

    return parts.join('\n');
}

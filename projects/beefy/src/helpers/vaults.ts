import { erc20Abi, PublicClient } from 'viem';
import { MOO_TOKEN_DECIMALS } from '../constants';
import BeefyClient, { ApyBreakdown, TvlInDollarsData, VaultInfo } from './beefyClient';
import { getChainIdFromBeefyChainName, getChainIdFromProvider, isBeefyChainSupported } from './chains';
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
    mooTokenUserBalance?: bigint;
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
            const chainId = getChainIdFromBeefyChainName(vault.chain);
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
    if (vault.mooTokenUserBalance !== undefined) {
        parts.push(`${offset}- Your balance: ${vault.mooTokenUserBalance}`);
    }
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

/**
 * Return the list of vaults that the user has ever deposited into.
 * Optionally, specify a chain ID to restrict the results to a
 * single chain.
 */
export async function getUserHistoricalVaults(address: string, chainId?: number): Promise<SimplifiedVault[]> {
    const beefyClient = new BeefyClient();
    const timeline = await beefyClient.getAddressTimeline(address);
    // Fetch all the vaults in the timeline
    let idChainPairs: { id: string; chain: string }[] = [];
    for (const entry of timeline) {
        if (chainId && getChainIdFromBeefyChainName(entry.chain) !== chainId) {
            continue;
        }
        idChainPairs.push({ id: entry.display_name, chain: entry.chain });
    }
    // Make sure there are no duplicates
    idChainPairs = idChainPairs.filter((value, index, self) => self.findIndex((t) => t.id === value.id && t.chain === value.chain) === index);
    // Fetch the vaults
    let vaults: SimplifiedVault[] = [];
    for (const pair of idChainPairs) {
        const vault = await getSimplifiedVaultByIdAndChain(pair.id, pair.chain);
        if (vault) {
            vaults.push(vault);
        }
    }
    return vaults;
}

/**
 * Return the list of vaults where the user currently has a position.
 *
 * The user's current vaults are determined by checking the user's
 * balance of the mooToken in each vault in its timeline.
 *
 * The balance check is made with a Viem multicall as described in
 * https://viem.sh/docs/contract/multicall.html
 *
 * Please note that the chain here is defined by whatever the RPC
 * endpoint the PublicClient is connected to.
 */
export async function getUserCurrentVaults(address: string, publicClient: PublicClient): Promise<SimplifiedVault[]> {
    const chainId = getChainIdFromProvider(publicClient);
    const historicalVaults = await getUserHistoricalVaults(address, chainId);

    if (historicalVaults.length === 0) {
        return [];
    }

    // Set up multicall contracts with balanceOf for each mooToken
    const contractCalls = historicalVaults.map((vault) => ({
        address: vault.mooTokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [address as `0x${string}`],
    }));

    // Execute the multicall to get all balances at once
    const balanceResults = await publicClient.multicall({
        contracts: contractCalls,
        allowFailure: true,
    });

    // Transform vaults with balance > 0
    const currentVaults = historicalVaults.filter((vault, index) => {
        if (balanceResults[index].status !== 'success') {
            throw new Error(`Could not fetch balance of vault ${vault.id}, please retry`);
        }
        const balance = BigInt(balanceResults[index].result);
        vault.mooTokenUserBalance = balance;
        return balance > 0n;
    });

    return currentVaults;
}

/**
 * Return a simplified vault given a vault name and chain name,
 * or null if no vault is found.
 *
 * The chain name must be given as a valid Beefy chain name.
 *
 * If multiple vaults are found, throw an error.
 */
export async function getSimplifiedVaultByIdAndChain(id: string, chain: string): Promise<SimplifiedVault | null> {
    const simplifiedVaults = await getAllSimplifiedVaults();
    const matches = simplifiedVaults.filter((vault) => vault.id === id && vault.chain === chain);
    if (matches.length === 0) {
        return null;
    }
    if (matches.length > 1) {
        throw new Error(`Multiple vaults found for name ${name} and chain ${chain}.  Ids: ${matches.map((vault) => vault.id).join(', ')}`);
    }
    return matches[0];
}

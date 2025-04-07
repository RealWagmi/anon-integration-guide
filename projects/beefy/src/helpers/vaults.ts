import { erc20Abi, PublicClient } from 'viem';
import { MOO_TOKEN_DECIMALS } from '../constants';
import BeefyClient, { ApyBreakdown, TvlInDollarsData, VaultInfo } from './beefyClient';
import { getBeefyChainNameFromAnonChainName, getChainIdFromBeefyChainName, getChainIdFromProvider, isBeefyChainSupported } from './chains';
import { to$$$, toHumanReadableAmount } from './format';
import { getTokenFraction } from './tokens';

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
    depositedTokenSymbol: string;
    depositedTokenAddress: string;
    depositedTokenDecimals: number;
    mooTokenSymbol: string;
    mooTokenAddress: string;
    mooTokenDecimals: number;
    mooTokenUserBalance?: bigint;
    mooTokenUserUsdBalance?: number;
}

/**
 * Return all vaults from the Beefy API, in the SimplifiedVault format.
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
 * Return vaults from the given chain, in the SimplifiedVault format.
 * The chain must be a valid HeyAnon chain name.
 *
 * Please note that this function will still fetch all vaults from
 * they Beefy APY.
 */
export async function getSimplifiedVaultsForChain(chain: string): Promise<SimplifiedVault[]> {
    const allVaults = await getAllSimplifiedVaults();
    const beefyChainName = getBeefyChainNameFromAnonChainName(chain);
    return allVaults.filter((vault) => vault.chain === beefyChainName);
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
                depositedTokenSymbol: vault.token,
                depositedTokenAddress: vault.tokenAddress,
                depositedTokenDecimals: vault.tokenDecimals,
                mooTokenSymbol: vault.earnedToken,
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
    parts.push(`${titlePrefix}Vault ${vault.name}:`);
    const offset = '   ';
    if (vault.mooTokenUserUsdBalance !== undefined) {
        parts.push(`${offset}- Your balance: ${to$$$(vault.mooTokenUserUsdBalance)}`);
    }
    if (vault.mooTokenUserBalance !== undefined) {
        parts.push(`${offset}- Your balance in the vault token: ${toHumanReadableAmount(vault.mooTokenUserBalance, vault.mooTokenDecimals)} mooTokens`);
    }
    parts.push(`${offset}- Underlying asset${vault.assets.length > 1 ? 's' : ''}: ${vault.assets.join(', ')}`);
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
 * Return the list of vaults that the user has ever deposited into,
 * according to the timeline endpoint of the Beefy API.
 *
 * Please note that there is a 10 minute delay for the timeline
 * endpoint to update, therefore newly deposited vaults will not
 * be immediately reflected in the results.
 *
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
 * Return the list of vaults where the user currently has a position,
 * and compute the user's USD balance in each vault as the product of
 * the vault's TVL and the user's percent share in the mooToken.
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

    let currentVaults: SimplifiedVault[] = [];

    // Select only vaults with user balance > 0, and compute the user's USD balance
    for (let i = 0; i < historicalVaults.length; i++) {
        const vault = historicalVaults[i];
        if (balanceResults[i].status !== 'success') {
            throw new Error(`Could not fetch balance of vault ${historicalVaults[i].id}, please retry`);
        }
        const balance = balanceResults[i].result;
        if (balance === 0n) {
            continue;
        }
        // Compute the user's USD balance
        if (vault.tvl !== null) {
            const mooTokenTotalSupply = await publicClient.readContract({
                address: vault.mooTokenAddress as `0x${string}`,
                abi: erc20Abi,
                functionName: 'totalSupply',
            });
            const userFraction = getTokenFraction(balance as bigint, mooTokenTotalSupply);
            vault.mooTokenUserUsdBalance = userFraction * vault.tvl;
        }
        currentVaults.push(vault);
    }

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

/**
 * Check if a vault contains a specific token, either directly or
 * as part of a liquidity pool.
 *
 * If noLp is true, exclude vaults that only have the token as part of a liquidity pool.
 */
export function vaultContainsToken(vault: SimplifiedVault, symbol: string, noLp: boolean = false): boolean {
    if (noLp) {
        return vault.depositedTokenSymbol.toLowerCase() === symbol.toLowerCase();
    }
    return vault.assets.some((asset) => asset.toLowerCase() === symbol.toLowerCase());
}

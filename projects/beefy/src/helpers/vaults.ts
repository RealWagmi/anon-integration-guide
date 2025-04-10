import { erc20Abi, formatUnits, PublicClient } from 'viem';
import { E18, MOO_TOKEN_DECIMALS } from '../constants';
import BeefyClient, { ApyBreakdown, TvlInDollarsData, VaultInfo } from './beefyClient';
import { getBeefyChainNameFromAnonChainName, getChainIdFromBeefyChainName, getChainIdFromProvider, isBeefyChainSupported } from './chains';
import { titleCase, to$$$, toHumanReadableAmount } from './format';
import { getTokenFraction } from './tokens';
import { beefyVaultAbi } from '../abis';

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
    oracle: 'lps' | 'tokens';
    oracleId: string;
    vaultContractAddress: `0x${string}`;
    pricePerFullShare: string;
    userUsdTvl?: number;
    depositedTokenSymbol: string;
    depositedTokenAddress?: `0x${string}`; // not set for chain tokens e.g. ETH on Ethereum
    depositedTokenDecimals: number;
    depositedTokenPlatform: string;
    depositedTokenProvider?: string;
    depositedTokenUrl: string | null;
    depositedTokenUserBalance?: bigint;
    mooTokenSymbol: string;
    mooTokenAddress: `0x${string}`;
    mooTokenDecimals: number;
    mooTokenUserBalance?: bigint;
}

/**
 * Return all vaults from the Beefy API, in the SimplifiedVault format.
 *
 * Only vaults from chains in supportedChains are included.
 */
export async function getAllSimplifiedVaults(includeRetired: boolean = false, includePaused: boolean = false): Promise<SimplifiedVault[]> {
    const beefyClient = new BeefyClient();
    let vaults = await beefyClient.getVaults();
    if (!includeRetired) {
        vaults = vaults.filter((vault) => !vault.retiredAt);
    }
    if (!includePaused) {
        vaults = vaults.filter((vault) => !vault.pausedAt);
    }
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
                oracle: vault.oracle,
                oracleId: vault.oracleId,
                vaultContractAddress: vault.earnContractAddress,
                pricePerFullShare: vault.pricePerFullShare,
                depositedTokenSymbol: vault.token,
                depositedTokenAddress: vault.tokenAddress,
                depositedTokenDecimals: vault.tokenDecimals,
                depositedTokenPlatform: vault.platformId,
                depositedTokenProvider: vault.tokenProviderId,
                depositedTokenUrl: getDepositedTokenUrl(vault),
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
    if (vault.userUsdTvl !== undefined) {
        parts.push(`${offset}- Your balance: ${to$$$(vault.userUsdTvl, 2, 6)}`);
    }
    if (vault.depositedTokenUserBalance !== undefined) {
        parts.push(
            `${offset}- Your balance in the vault token: ${toHumanReadableAmount(vault.depositedTokenUserBalance, vault.depositedTokenDecimals)} ${vault.depositedTokenSymbol}`,
        );
    }
    let by = titleCase(vault.depositedTokenPlatform);
    if (vault.depositedTokenProvider && vault.depositedTokenProvider !== vault.depositedTokenPlatform) {
        by += `/${titleCase(vault.depositedTokenProvider)}`;
    }
    parts.push(`${offset}- Vault token: ${vault.depositedTokenSymbol} by ${by}`);
    if (vault.assets.length > 1 || vault.assets[0] !== vault.depositedTokenSymbol) {
        parts.push(`${offset}- Underlying asset${vault.assets.length > 1 ? 's' : ''}: ${vault.assets.join(', ')}`);
    }
    if (vault.totalApy !== null) {
        parts.push(`${offset}- APY: ${(vault.totalApy * 100).toFixed(2)}%`);
    } else {
        parts.push(`${offset}- APY: N/A`);
    }
    if (vault.tvl !== null) {
        parts.push(`${offset}- TVL: ${to$$$(vault.tvl, 0, 0)}`);
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
 * and compute the user's USD balance in each vault.
 *
 * The chain here is defined by whatever the RPC endpoint the PublicClient
 * is connected to.
 */
export async function getUserCurrentVaults(address: string, provider: PublicClient): Promise<SimplifiedVault[]> {
    const chainId = getChainIdFromProvider(provider);
    const historicalVaults = await getUserHistoricalVaults(address, chainId);

    if (historicalVaults.length === 0) {
        return [];
    }

    return getVaultsWithUserBalances(historicalVaults, address, provider, false);
}

/**
 * Given a list of vaults, return a new list of vaults with the user's
 * balance in each vault, including USD value, fetched from the RPC.
 *
 * The USD value is computed as the product of the vault's TVL and the
 * user's percent share in the mooToken.
 *
 * The balance check is made with a Viem multicall as described in
 * https://viem.sh/docs/contract/multicall.html
 *
 * Please note that the chain here is defined by whatever the RPC
 * endpoint the PublicClient is connected to.
 */
export async function getVaultsWithUserBalances(
    vaults: SimplifiedVault[],
    address: string,
    provider: PublicClient,
    includeVaultsWithNoBalance: boolean = true,
): Promise<SimplifiedVault[]> {
    // Multicall to get all mooToken balances at once
    const balanceContractCalls = vaults.map((vault) => ({
        address: vault.mooTokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [address as `0x${string}`],
    }));

    const balanceResults = await provider.multicall({
        contracts: balanceContractCalls,
        allowFailure: true,
    });

    // Multicall to get all mooToken total supplies at once
    const totalSupplyContractCalls = vaults.map((vault) => ({
        address: vault.mooTokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: 'totalSupply',
    }));

    const totalSupplyResults = await provider.multicall({
        contracts: totalSupplyContractCalls,
        allowFailure: true,
    });

    let updatedVaults: SimplifiedVault[] = [];

    // Select only vaults with user balance > 0, and compute the user's USD balance
    for (let i = 0; i < vaults.length; i++) {
        const vault = { ...vaults[i] } as SimplifiedVault; // clone the vault to avoid mutating the original

        if (balanceResults[i].status !== 'success') {
            throw new Error(`Could not fetch balance of vault ${vaults[i].id}, please retry`);
        }
        if (totalSupplyResults[i].status !== 'success') {
            throw new Error(`Could not fetch total supply of vault ${vaults[i].id}, please retry`);
        }
        vault.mooTokenUserBalance = balanceResults[i].result as bigint;
        const totalSupply = totalSupplyResults[i].result as bigint;
        if (vault.mooTokenUserBalance === 0n) {
            if (includeVaultsWithNoBalance) {
                updatedVaults.push(vault);
            }
            continue;
        }

        // Compute the user balances in the deposited token (rather
        // than the receipt mooToken)
        vault.depositedTokenUserBalance = getDepositedTokenBalance(vault, vault.mooTokenUserBalance);
        vault.userUsdTvl = await getUserTvlInVault(vault, vault.mooTokenUserBalance);

        // Update the vault TVL with the fresh USD balance
        if (vault.tvl !== null) {
            const userFraction = getTokenFraction(vault.mooTokenUserBalance, totalSupply);
            const staleUsdBalance = userFraction * vault.tvl;
            vault.tvl += vault.userUsdTvl - staleUsdBalance;
        }
        updatedVaults.push(vault);
    }

    return updatedVaults;
}

/**
 * Same as getVaultsWithUserBalances, but with a single vault
 */
export async function getVaultWithUserBalance(vault: SimplifiedVault, address: string, provider: PublicClient): Promise<SimplifiedVault> {
    const updatedVaults = await getVaultsWithUserBalances([vault], address, provider, false);
    return updatedVaults[0];
}

/**
 * Return a simplified vault given a vault id and Beefy chain
 * name, or null if no vault is found.
 *
 * If multiple vaults are found, throw an error.
 */
export async function getSimplifiedVaultByIdAndChain(id: string, chain: string): Promise<SimplifiedVault | null> {
    const simplifiedVaults = await getAllSimplifiedVaults();
    const matches = simplifiedVaults.filter((vault) => vault.id.toLowerCase() === id.toLowerCase() && vault.chain === chain);
    if (matches.length === 0) {
        return null;
    }
    if (matches.length > 1) {
        throw new Error(`Multiple vaults found for id ${id} and chain ${chain}.  Ids: ${matches.map((vault) => vault.id).join(', ')}`);
    }
    return matches[0];
}

/**
 * Return a list of simplified vaults that match a given vault name
 * and Beefy chain name.
 *
 * The vault name is a partial match, and the search is case-insensitive.
 */
export async function getSimplifiedVaultsByNameAndChainPartialMatch(name: string, chain: string): Promise<SimplifiedVault[]> {
    const simplifiedVaults = await getAllSimplifiedVaults();
    const filteredVaults = simplifiedVaults.filter((vault) => vault.name.toLowerCase().includes(name.toLowerCase()) && vault.chain === chain);
    return filteredVaults;
}

/**
 * Return the simplified vault that matches the given vault name.
 *
 * The vault name is an exact match, and the search is case-insensitive.
 */
export async function getSimplifiedVaultByNameAndChain(name: string, chain: string): Promise<SimplifiedVault | null> {
    const simplifiedVaults = await getAllSimplifiedVaults();
    const matches = simplifiedVaults.filter((vault) => vault.name.toLowerCase() === name.toLowerCase() && vault.chain === chain);
    if (matches.length === 0) {
        return null;
    }
    if (matches.length > 1) {
        throw new Error(`Multiple vaults found for name ${name} and chain ${chain}.  Names: ${matches.map((vault) => vault.name).join(', ')}`);
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

/**
 * Return the URL the user has to visit to acquire the deposited token
 * for a given vault.  This is either an liquidiry add page or a swap
 * token page.
 */
export function getDepositedTokenUrl(vault: VaultInfo): string | null {
    if (vault.oracle === 'tokens') {
        return vault.buyTokenUrl ?? null;
    } else if (vault.oracle === 'lps') {
        return vault.addLiquidityUrl ?? null;
    } else {
        throw new Error(`Unknown oracle type ${vault.oracle} for vault ${vault.id}`);
    }
}

/**
 * Given a vault, return the address of the deposited token ('want') by
 * fetching it on-chain on the vault contract.
 *
 * This is safer than using the address returned by the Beefy API,
 * which sometimes is null (e.g. for wrapped native tokens)
 *
 * @throws {Error} If the address cannot be fetched
 */
export async function getDepositedTokenAddress(vault: SimplifiedVault, provider: PublicClient): Promise<`0x${string}`> {
    const depositedTokenAddress = (await provider.readContract({
        address: vault.vaultContractAddress as `0x${string}`,
        abi: beefyVaultAbi,
        functionName: 'want',
    })) as `0x${string}`;
    if (!depositedTokenAddress) throw new Error('Could not get depositedtoken address from vault contract');
    return depositedTokenAddress;
}

/**
 * Given a vault, return the price of the vault deposited token
 * in USD, using the Beefy API.
 */
export async function getVaultDepositedTokenPrice(vault: SimplifiedVault): Promise<number> {
    const beefyClient = new BeefyClient();
    if (vault.oracle === 'tokens') {
        const prices = await beefyClient.getPrices();
        return prices[vault.oracleId];
    } else if (vault.oracle === 'lps') {
        const lps = await beefyClient.getLps();
        return lps[vault.oracleId];
    } else {
        throw new Error(`Unknown oracle type ${vault.oracle} for vault ${vault.id}`);
    }
}

/**
 * Given a vault and the user's mooToken balance in the vault, return the
 * amount of deposited tokens the user has in the vault.  This is computed as the
 * product of the user's mooToken balance and the price per full share.
 */
export function getDepositedTokenBalance(vault: SimplifiedVault, mooTokenUserBalance: bigint): bigint {
    return (BigInt(vault.pricePerFullShare) * mooTokenUserBalance) / E18;
}

/**
 * Given a vault and the user's mooToken balance in the vault, return the
 * USD value of the user's TVL in the vault
 *
 * The formula is:
 * - shares = mooToken user balance
 * - deposited token amount = shares * price per full share
 * - USD value = deposited token amount * price of deposited token
 *
 * Source: https://discord.com/channels/755231190134554696/758368074968858645/1304062150913949747
 */
export async function getUserTvlInVault(vault: SimplifiedVault, mooTokenUserBalance: bigint): Promise<number> {
    const depositedTokenBalance = getDepositedTokenBalance(vault, mooTokenUserBalance);
    const price = await getVaultDepositedTokenPrice(vault);
    return Number(formatUnits(depositedTokenBalance, vault.depositedTokenDecimals)) * price;
}

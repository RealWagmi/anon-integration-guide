import { EVM, FunctionOptions, FunctionReturn, toResult, EvmChain } from '@heyanon/sdk';
import { MAX_VAULTS_IN_RESULTS, supportedChains } from '../constants';
import { formatVault, getSimplifiedVaultsByNameAndChain, getUpdatedVaultsWithUserBalance } from '../helpers/vaults';
import { getBeefyChainNameFromAnonChainName } from '../helpers/chains';

interface Props {
    chainName: string;
    account: string;
    vaultName: string;
}

/**
 * Gets detailed information about a vault matching a specific name.
 * Returns multiple matches (with error) if name is ambiguous.
 *
 * @param {Object} props - The input parameters
 * @param {string} props.chainName - Name of the blockchain network
 * @param {Address} props.account - Address to check position for
 * @param {string} props.vaultName - Full or partial name of vault to search for
 * @returns {Promise<FunctionReturn>} Detailed vault information or list of matching vaults
 */
export async function getVaultInfoFromVaultName({ chainName, account, vaultName }: Props, options: FunctionOptions): Promise<FunctionReturn> {
    const chainId = EVM.utils.getChainFromName(chainName as EvmChain);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Beefy protocol is not supported on ${chainName}`, true);

    // Get vaults matching the name
    const beefyChainName = getBeefyChainNameFromAnonChainName(chainName);
    let vaults = await getSimplifiedVaultsByNameAndChain(vaultName, beefyChainName);
    let numVaults = vaults.length;

    // Reduce number of vaults to MAX_VAULTS_IN_RESULTS and compute balances
    vaults = vaults.slice(0, MAX_VAULTS_IN_RESULTS);
    if (!vaults || vaults.length === 0) {
        return toResult(`No vaults found matching name "${vaultName}"`);
    }
    const publicClient = options.evm.getProvider(chainId);
    vaults = await getUpdatedVaultsWithUserBalance(vaults, account, publicClient, true);

    // If multiple vaults match, return list of matches with error
    if (vaults.length > 1) {
        const matchingVaults = vaults.map((vault, index) => formatVault(vault, `${index + 1}. `)).join('\n');
        return toResult(`Found ${numVaults} vaults matching "${vaultName}":\n\n${matchingVaults}`, true);
    }

    // Return detailed info for the single matching vault
    const vault = vaults[0];
    return toResult(formatVault(vault));
}

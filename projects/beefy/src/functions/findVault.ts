import { EVM, FunctionOptions, FunctionReturn, toResult, EvmChain } from '@heyanon/sdk';
import { supportedChains } from '../constants';
import { formatVault, getSimplifiedVaultByIdAndChain, getSimplifiedVaultByNameAndChain, getUpdatedVaultsWithUserBalance } from '../helpers/vaults';
import { getBeefyChainNameFromAnonChainName } from '../helpers/chains';

interface Props {
    chainName: string;
    account: string;
    vaultIdOrName: string;
}

/**
 * Gets detailed information about a vault matching a specific name or ID.
 *
 * @param {Object} props - The input parameters
 * @param {string} props.chainName - Name of the blockchain network
 * @param {Address} props.account - Address to check position for
 * @param {string} props.vaultIdOrName - Case-insensitive ID or name of the vault to get information about
 * @returns {Promise<FunctionReturn>} Detailed vault information or list of matching vaults
 */
export async function findVault({ chainName, account, vaultIdOrName }: Props, options: FunctionOptions): Promise<FunctionReturn> {
    const chainId = EVM.utils.getChainFromName(chainName as EvmChain);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Beefy protocol is not supported on ${chainName}`, true);

    const beefyChainName = getBeefyChainNameFromAnonChainName(chainName);

    // Get the vault matching the ID
    let vault = await getSimplifiedVaultByIdAndChain(vaultIdOrName, beefyChainName);
    if (!vault) {
        vault = await getSimplifiedVaultByNameAndChain(vaultIdOrName, beefyChainName);
    }
    if (!vault) return toResult(`Could not find vault ${vaultIdOrName}`, true);

    // If an account is provided, update the vault with the user's balance
    if (account) {
        const publicClient = options.evm.getProvider(chainId);
        const [vaultWithUserBalance] = await getUpdatedVaultsWithUserBalance([vault], account, publicClient, true);
        vault = vaultWithUserBalance;
    }

    return toResult(formatVault(vault, ''));
}

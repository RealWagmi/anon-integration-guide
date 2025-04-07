import { Address } from 'viem';
import { EVM, FunctionOptions, FunctionReturn, toResult, EvmChain } from '@heyanon/sdk';
import { supportedChains } from '../constants';
import { formatVault, getSimplifiedVaultByIdAndChain, getUpdatedVaultsWithUserBalance } from '../helpers/vaults';
import { getBeefyChainNameFromAnonChainName } from '../helpers/chains';

interface Props {
    chainName: string;
    account: Address | null;
    vaultId: string;
}

/**
 * Gets detailed information about a specific vault by its ID.
 * Includes composition, TVL, APY and user position if account provided.
 *
 * @param {Object} props - The input parameters
 * @param {string} props.chainName - Name of the blockchain network
 * @param {Address|null} props.account - Optional address to check position for
 * @param {string} props.vaultId - ID of the vault to query
 * @returns {Promise<FunctionReturn>} Detailed vault information
 */
export async function getVaultInfoFromVaultId({ chainName, account, vaultId }: Props, options: FunctionOptions): Promise<FunctionReturn> {
    const chainId = EVM.utils.getChainFromName(chainName as EvmChain);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Beets protocol is not supported on ${chainName}`, true);

    // Get the vault info
    const beefyChainName = getBeefyChainNameFromAnonChainName(chainName);
    let vault = await getSimplifiedVaultByIdAndChain(vaultId, beefyChainName);
    if (!vault) return toResult(`Could not find vault with ID ${vaultId}`, true);

    // If an account is provided, update the vault with the user's balance
    if (account) {
        const publicClient = options.evm.getProvider(chainId);
        const [vaultWithUserBalance] = await getUpdatedVaultsWithUserBalance([vault], account, publicClient, true);
        vault = vaultWithUserBalance;
    }

    return toResult(formatVault(vault, ''));
}

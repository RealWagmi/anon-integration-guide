import { Address } from 'viem';
import { EVM, FunctionReturn, toResult, FunctionOptions, EvmChain } from '@heyanon/sdk';
import { MAX_VAULTS_IN_RESULTS, supportedChains } from '../constants';
import { formatVault, getSimplifiedVaultsForChain, vaultContainsToken } from '../helpers/vaults';
import { getTokenInfoFromAddress } from '../helpers/tokens';

interface Props {
    chainName: string;
    tokenAddress: Address;
}

/**
 * Finds vaults with the highest APY that contain a specific token,
 * either directly or as part of a liquidity pool.
 *
 * @param {Object} props - The input parameters
 * @param {string} props.chainName - Name of the blockchain network
 * @param {Address} props.tokenAddress - Address of token to search for
 * @param {FunctionOptions} options - HeyAnon SDK options, including provider and notification handlers
 * @returns {Promise<FunctionReturn>} List of vaults sorted by APY with vault details
 */
export async function getBestApyForUnderlyingToken({ chainName, tokenAddress }: Props, _options: FunctionOptions): Promise<FunctionReturn> {
    const chainId = EVM.utils.getChainFromName(chainName as EvmChain);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Beefy protocol is not supported on ${chainName}`, true);

    // Fetch the token symbol
    const token = await getTokenInfoFromAddress(chainName, tokenAddress);
    if (!token) return toResult(`Could not find token information`, true);

    // Get all vaults on chain
    const vaults = await getSimplifiedVaultsForChain(chainName);
    // Filter vaults with the given token, and with apy information
    const matchingVaults = vaults.filter((vault) => vault.totalApy !== null && vaultContainsToken(vault, token.symbol));
    if (!matchingVaults || matchingVaults.length === 0) {
        return toResult(`No vaults found containing token ${token.symbol} on chain ${chainName}`);
    }
    // Sort vaults by APY
    const sortedVaults = matchingVaults.sort((a, b) => (b.totalApy as number) - (a.totalApy as number));

    return toResult(
        sortedVaults
            .slice(0, MAX_VAULTS_IN_RESULTS)
            .map((vault, index) => formatVault(vault, `${index + 1}. `))
            .join('\n'),
    );
}

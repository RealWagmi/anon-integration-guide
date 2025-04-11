import { Address } from 'viem';
import { EVM, FunctionReturn, toResult, EvmChain, FunctionOptions } from '@heyanon/sdk';
import { MAX_VAULTS_IN_RESULTS, supportedChains } from '../constants';
import { formatVault, getUserCurrentVaults } from '../helpers/vaults';

interface Props {
    chainName: string;
    account: Address;
}

/**
 * Retrieves all vaults positions for a given account on a given chain.
 * Returns positions sorted by USD value.
 *
 * @param {Object} props - The input parameters
 * @param {string} props.chainName - Name of the blockchain network
 * @param {Address} props.account - Address to check positions for
 * @returns {Promise<FunctionReturn>} List of positions with vault details, token amounts, and APR
 */
export async function getMyPositionsPortfolio({ chainName, account }: Props, options: FunctionOptions): Promise<FunctionReturn> {
    const chainId = EVM.utils.getChainFromName(chainName as EvmChain);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Beefy protocol is not supported on ${chainName}`, true);

    const publicClient = options.evm.getProvider(chainId);
    const positions = await getUserCurrentVaults(account, publicClient);

    if (!positions || positions.length === 0) {
        return toResult('No positions found in your portfolio');
    }
    return toResult(
        positions
            .slice(0, MAX_VAULTS_IN_RESULTS)
            .map((position, index) => formatVault(position, `${index + 1}. `))
            .join('\n'),
    );
}

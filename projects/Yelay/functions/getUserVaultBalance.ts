import { Address } from 'viem';
import { FunctionReturn, FunctionOptions, toResult, getChainFromName } from '@heyanon/sdk';
import { supportedChains } from '../constants';
import { getChainConfig, getSdk, wrapWithResult } from '../utils';
import { UserBalancesInfoQuery } from '@spool.fi/spool-v2-sdk';

export interface GetUserBalanceProps {
    chainName: string;
    account: Address;
    vaultAddress: string;
}

/**
 * Gets users balance for a pool.
 * @param props - The function parameters
 * @param tools - System tools for blockchain interactions
 * @returns Transaction result
 */
export async function getUserVaultBalance(
    { chainName, account, vaultAddress }: GetUserBalanceProps,
    { notify }: FunctionOptions,
): Promise<FunctionReturn> {
    // Check wallet connection
    if (!account) return toResult('Wallet not connected', true);

    // Validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId))
        return toResult(`Protocol is not supported on ${chainName}`, true);

    const config = wrapWithResult(getChainConfig)(chainId);
    if (!config.success) return toResult(`Failed get config`, true);

    const sdk = wrapWithResult(getSdk)(chainId);
    if (!sdk.success) return toResult(`Failed to setup SDK`, true);

    // Getting account balance
    await notify(`Getting balance for account ${account} in vault ${vaultAddress}...`);

    const userBalancesInfoQuery: UserBalancesInfoQuery = {
        vaultAddresses: [vaultAddress],
        userAddress: account,
    };
    const result = await sdk.result.views.userInfo.getUserVaultsBalances(userBalancesInfoQuery);
    if (!result[vaultAddress]) {
        return toResult(`No balances for account ${account} found in vault ${vaultAddress}`);
    }

    // TODO: better describe what balance means
    const balances = result[vaultAddress].join(', ');

    return toResult(`Balances for account ${account} in vault ${vaultAddress} are [ ${balances} ]`);
}

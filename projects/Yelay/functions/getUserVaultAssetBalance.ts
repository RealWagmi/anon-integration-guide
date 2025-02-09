import { Address } from 'viem';
import { FunctionReturn, FunctionOptions, toResult, getChainFromName } from '@heyanon/sdk';
import { supportedChains } from '../constants';
import { getChainConfig, getSdk, wrapWithResult } from '../utils';
import { UserBalancesInfoQuery, VaultDetailsQuery } from '@spool.fi/spool-v2-sdk';

export interface GetUserVaultAssetBalanceProps {
    chainName: string;
    account: Address;
    vaultAddress: string;
}

/**
 * Gets user's vault asset balance.
 * @param props - The function parameters
 * @param tools - System tools for blockchain interactions
 * @returns Transaction result
 */
export async function getUserVaultAssetBalance(
    { chainName, account, vaultAddress }: GetUserVaultAssetBalanceProps,
    { notify }: FunctionOptions,
): Promise<FunctionReturn> {
    // Check wallet connection
    if (!account) return toResult('Wallet not connected', true);

    // Validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId))
        return toResult(`Protocol is not supported on ${chainName}`, true);

    const sdk = await wrapWithResult(getSdk)(chainId);
    if (!sdk.success) return toResult(`Failed to setup SDK`, true);

    // Getting account balance
    await notify(`Getting asset balance for account ${account} in vault ${vaultAddress}...`);

    const userBalancesInfoQuery: UserBalancesInfoQuery = {
        vaultAddresses: [vaultAddress],
        userAddress: account,
    };
    const assetBalances =
        await sdk.result.views.userInfo.getUserVaultsBalances(userBalancesInfoQuery);
    if (!assetBalances[vaultAddress] || assetBalances[vaultAddress].length === 0) {
        return toResult(`No balances for account ${account} found in vault ${vaultAddress}`);
    }

    const vaultDetailsQuery: VaultDetailsQuery = {
        vaultAddress: vaultAddress,
    };
    const vaultDetails = await wrapWithResult(sdk.result.views.vaultInfo.getVaultDetails)(
        vaultDetailsQuery,
    );
    if (!vaultDetails.success) return toResult(`Failed fetch vault asset balance`, true);

    const tokenSymbol = vaultDetails.result.assetGroup.tokens.map((it) => it.symbol);

    if (assetBalances[vaultAddress].length !== tokenSymbol.length) {
        return toResult(`Error calculating vault asset balances`);
    }

    const vaultAssetBalanceString = assetBalances[vaultAddress]
        .map((assetBalance, index) => {
            return `${assetBalance} ${tokenSymbol[index]}`;
        })
        .join(', ');

    return toResult(
        `Balance for account ${account} in vault ${vaultAddress} is ${vaultAssetBalanceString}`,
    );
}

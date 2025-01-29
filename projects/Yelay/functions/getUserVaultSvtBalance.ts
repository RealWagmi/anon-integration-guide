import { Address } from 'viem';
import { FunctionReturn, FunctionOptions, toResult, getChainFromName } from '@heyanon/sdk';
import { supportedChains } from '../constants';
import { getChainConfig, getSdk, wrapWithResult } from '../utils';

export interface GetUserSvtBalanceProps {
    chainName: string;
    account: Address;
    vaultAddress: string;
}

/**
 * Gets users svt balance for a pool.
 * @param props - The function parameters
 * @param tools - System tools for blockchain interactions
 * @returns Transaction result
 */
export async function getUserVaultSvtBalance(
    { chainName, account, vaultAddress }: GetUserSvtBalanceProps,
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
    if (!config.success) return toResult(`Failed to get config`, true);

    const sdk = wrapWithResult(getSdk)(chainId);
    if (!sdk.success) return toResult(`Failed to setup SDK`, true);

    // Getting account balance
    await notify(`Getting balance for account ${account} in vault ${vaultAddress}...`);

    const svtBalance = await sdk.result.views.userInfo.getUserSVTBalance(vaultAddress, account);

    // TODO: approve this response
    return toResult(
        `Balance for account ${account} in vault ${vaultAddress} is ${svtBalance} SVTs`,
    );
}

// deposit -> swapAndDeposit.deposit
// fast withdrawal -> withdraw.redeemFast

// get Asset -> getUserAsset
// get 7D Apy -> job api maybe
// get total earned yield -> not gonna do it

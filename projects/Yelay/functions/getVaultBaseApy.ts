import { Address } from 'viem';
import { FunctionReturn, FunctionOptions, toResult, getChainFromName } from '@heyanon/sdk';
import { supportedChains } from '../constants';
import { getChainConfig, getSdk, wrapWithResult } from '../utils';
import { VaultAPYInfoQuery } from '@spool.fi/spool-v2-sdk';

export interface GetVaultBaseApyProps {
    chainName: string;
    vaultAddress: string;
}

/**
 * Gets vault's 7 day APY.
 * @param props - The function parameters
 * @param tools - System tools for blockchain interactions
 * @returns Transaction result
 */
export async function getVaultBaseApy(
    { chainName, vaultAddress }: GetVaultBaseApyProps,
    { notify }: FunctionOptions,
): Promise<FunctionReturn> {
    // Validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId))
        return toResult(`Protocol is not supported on ${chainName}`, true);

    const config = await wrapWithResult(getChainConfig)(chainId);
    if (!config.success) return toResult(`Failed to get config`, true);

    const sdk = await wrapWithResult(getSdk)(chainId);
    if (!sdk.success) return toResult(`Failed to setup SDK`, true);

    // Getting account balance
    await notify(`Getting base day APY for vault ${vaultAddress}...`);

    const vaultAPYInfoQuery: VaultAPYInfoQuery = {
        vaultAddressList: [vaultAddress],
        networkName: 'MAINNET',
    };

    const vaultApy = await wrapWithResult(sdk.result.views.vaultInfo.getVaultAPY)(
        vaultAPYInfoQuery,
    );
    if (!vaultApy.success) return toResult(`Failed fetch APY for vault`, true);

    const baseApyDecimal = vaultApy.result[vaultAddress].baseApyNum / 1e16;
    const baseAPYRoundedTwoDecimals = Math.round(baseApyDecimal * 100) / 100;

    return toResult(`APY for vault ${vaultAddress} is ${baseAPYRoundedTwoDecimals} SVTs`);
}

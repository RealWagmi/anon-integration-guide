import { Address, parseUnits } from 'viem';
import {
    FunctionReturn,
    FunctionOptions,
    toResult,
    getChainFromName,
    TransactionParams,
    ChainId,
} from '@heyanon/sdk';
import { supportedChains } from '../constants';
import { getChainConfig, getSdk, getProvider, validateAddress, wrapWithResult } from '../utils';
import { MinimumBurnRedeemBag, RedeemBagStruct } from '@spool.fi/spool-v2-sdk';

export interface UserFastRedeemFromVaultProps {
    chainName: string;
    account: Address;
    vaultAddress: Address;
    assetsToWithdraw: string;
}

/**
 * User deposits to vault.
 * @param props - The function parameters
 * @param tools - System tools for blockchain interactions
 * @returns Transaction result
 */
export async function userFastRedeemFromVault(
    { chainName, account, vaultAddress, assetsToWithdraw }: UserFastRedeemFromVaultProps,
    { sendTransactions, notify }: FunctionOptions,
): Promise<FunctionReturn> {
    // Check wallet connection
    if (!account) return toResult('Wallet not connected', true);

    // Validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId))
        return toResult(`Protocol is not supported on ${chainName}`, true);

    // Validate amount
    const assetsToWithdrawBigInt = BigInt(assetsToWithdraw);
    if (assetsToWithdrawBigInt <= BigInt(0)) {
        return toResult(`Assets withdraw should be a positive number`, true);
    }

    const config = await wrapWithResult(getChainConfig)(chainId);
    if (!config.success) return toResult(`Failed to get config`, true);

    // Validate vault
    if (!config.result.functions.deposit.allowedVaults.includes(vaultAddress)) {
        return toResult(`This vault it not supported`, true);
    }
    const vaultAddressValidation = await wrapWithResult(validateAddress)(vaultAddress);
    if (!vaultAddressValidation.success) return toResult(`Vault address is invalid`, true);

    // setup sdk
    const sdk = await wrapWithResult(getSdk)(chainId);
    if (!sdk.success) return toResult(`Failed to setup SDK`, true);

    const ethersProvider = await wrapWithResult(getProvider)(chainId);
    if (!ethersProvider.success) return toResult(`Failed to get ethers provider`, true);

    // Get redeem bag for amount
    const assetsToWithdrawNoDecimals = parseUnits(assetsToWithdrawBigInt.toString(), 18);

    const minimumBurnRedeemBag: MinimumBurnRedeemBag = {
        userAddress: account,
        vaultAddress: vaultAddressValidation.result,
        assetsToWithdraw: [Number(assetsToWithdrawNoDecimals)],
    };
    const assetRedeemBag = await wrapWithResult(sdk.result.views.userInfo.getMinimumBurnRedeemBag)(
        minimumBurnRedeemBag,
    );
    if (!assetRedeemBag.success) {
        return toResult(`Failed fast redeem: failed to create redeem params`, true);
    }

    // Fast Redeem
    const latestBlock = await wrapWithResult(ethersProvider.result.getBlockNumber)();
    if (!latestBlock.success) {
        return toResult(`Failed fast redeem: failed to get latest block`, true);
    }

    const redeemFastData = await wrapWithResult(redeemFast)(
        config.result.functions.fastRedeem.apiUrl,
        chainId,
        assetRedeemBag.result,
        account,
        latestBlock.result,
    );

    if (!redeemFastData.success) {
        return toResult(`Failed fast redeem: failed create data`, true);
    }

    const redeemFastDataValidation = await wrapWithResult(validateAddress)(redeemFastData.result);
    if (!redeemFastDataValidation.success) {
        return toResult(`Failed fast redeem: invalid tx data`, true);
    }

    const userFastRedeemFromVaultTxParams: TransactionParams = {
        target: vaultAddressValidation.result,
        data: redeemFastDataValidation.result,
    };

    // sign and send ts
    await notify(
        `Fast redeeming ${assetsToWithdraw} SVTs from vault ${vaultAddressValidation.result} for account ${account}...`,
    );

    const transactions: Array<TransactionParams> = [userFastRedeemFromVaultTxParams];
    await sendTransactions({ chainId, account, transactions });

    return toResult(
        `Redeemed ${assetsToWithdraw} SVTs from vault ${vaultAddressValidation.result} for account ${account}...`,
    );
}

async function redeemFast(
    fastRedeemApiUrl: string,
    chainId: ChainId,
    redeem: RedeemBagStruct,
    receiver: string,
    latestBlock: number,
): Promise<string> {
    let nftInfoPaths = '';

    if (redeem.nftIds.length && redeem.nftAmounts.length) {
        nftInfoPaths = `${redeem.nftIds.join(',')}/${redeem.nftAmounts.join(',')}`;
    }
    const response = await fetch(
        new URL(
            `/${chainId}/${receiver}/${redeem.smartVault}/${redeem.shares.toString()}/${latestBlock}/${nftInfoPaths}`,
            fastRedeemApiUrl,
        ).toString(),
    );
    if (!response.ok) {
        throw new Error(`API request failed with status: ${response.status}`);
    }
    return await response.text();
}

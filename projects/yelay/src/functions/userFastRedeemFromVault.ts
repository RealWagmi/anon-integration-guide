import { Address, parseUnits } from 'viem';
import { EVM, FunctionReturn, FunctionOptions, toResult, EvmChain } from '@heyanon/sdk';
import { supportedChains } from '../constants';
import {
    getChainConfig,
    getSdk,
    getEthersProvider,
    validateAddress,
    wrapWithResult,
} from '../utils';
import { MinimumBurnRedeemBag, RedeemBagStruct, VaultDetailsQuery } from '@spool.fi/spool-v2-sdk';

export interface UserFastRedeemFromVaultProps {
    chainName: string;
    account: Address;
    vaultAddress: Address;
    amount: string;
}

/**
 * User deposits to vault.
 * @param props - The function parameters
 * @param tools - System tools for blockchain interactions
 * @returns Transaction result
 */
export async function userFastRedeemFromVault(
    { chainName, account, vaultAddress, amount }: UserFastRedeemFromVaultProps,
    { notify, evm: { sendTransactions } }: FunctionOptions,
): Promise<FunctionReturn> {
    // Check wallet connection
    if (!account) return toResult('Wallet not connected', true);

    // Validate chain
    const chainId = EVM.utils.getChainFromName(chainName as EvmChain);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId))
        return toResult(`Protocol is not supported on ${chainName}`, true);

    // Validate amount
    const amountBigInt = BigInt(amount);
    if (amountBigInt <= BigInt(0)) {
        return toResult(`Amount should be a positive number`, true);
    }

    const config = await wrapWithResult(getChainConfig)(chainId);
    if (!config.success) return toResult(`Failed to get config`, true);

    // Validate vault
    if (!config.result.functions.fastRedeem.allowedVaults.includes(vaultAddress)) {
        return toResult(`This vault it not supported`, true);
    }
    const vaultAddressValidation = await wrapWithResult(validateAddress)(vaultAddress);
    if (!vaultAddressValidation.success) return toResult(`Vault address is invalid`, true);

    // setup sdk
    const sdk = await wrapWithResult(getSdk)(chainId);
    if (!sdk.success) return toResult(`Failed to setup SDK`, true);

    const ethersProvider = await wrapWithResult(getEthersProvider)(chainId);
    if (!ethersProvider.success) return toResult(`Failed to get ethers provider`, true);

    // Get vault token type
    const vaultDetailsQuery: VaultDetailsQuery = {
        vaultAddress: vaultAddressValidation.result,
    };
    const vaultDetails = await wrapWithResult(sdk.result.views.vaultInfo.getVaultDetails)(
        vaultDetailsQuery,
    );
    if (!vaultDetails.success) return toResult(`Failed to get vault asset types`, true);

    if (vaultDetails.result.assetGroup.tokens.length != 1) {
        return toResult(`Only vaults with one asset are supported`, true);
    }
    const vaultTokenType = vaultDetails.result.assetGroup.tokens[0];

    // Get redeem bag for amount
    const assetsToWithdrawNoDecimals = parseUnits(amountBigInt.toString(), vaultTokenType.decimals);

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
    const latestBlock = await wrapWithResult(
        ethersProvider.result.getBlockNumber.bind(ethersProvider.result),
    )();
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

    const userFastRedeemFromVaultTxParams: EVM.types.TransactionParams = {
        target: vaultAddressValidation.result,
        data: redeemFastDataValidation.result,
    };

    // sign and send tx
    await notify(
        `Fast redeeming ${amount} ${vaultTokenType.symbol} from vault ${vaultAddressValidation.result} for account ${account}...`,
    );

    const transactions: Array<EVM.types.TransactionParams> = [userFastRedeemFromVaultTxParams];
    await sendTransactions({ chainId, account, transactions });

    return toResult(
        `Redeemed ${amount} ${vaultTokenType.symbol} from vault ${vaultAddressValidation.result} for account ${account}...`,
    );
}

async function redeemFast(
    fastRedeemApiUrl: string,
    chainId: number,
    redeem: RedeemBagStruct,
    receiver: string,
    latestBlock: number,
): Promise<string> {
    const chainIdNamesMap = new Map<string, string>();
    chainIdNamesMap.set('1', 'mainnet');
    chainIdNamesMap.set('42161', 'arbitrum');
    chainIdNamesMap.set('11155111', 'sepolia');

    const chaiName = chainIdNamesMap.get(chainId.toString());
    if (!chaiName) throw new Error(`Unsupported chain id ${chainId.toString()}`);

    let nftInfoPaths = '';

    if (redeem.nftIds.length && redeem.nftAmounts.length) {
        nftInfoPaths = `${redeem.nftIds.join(',')}/${redeem.nftAmounts.join(',')}`;
    }
    const response = await fetch(
        new URL(
            `/${chaiName}/${receiver}/${redeem.smartVault}/${redeem.shares.toString()}/${latestBlock}/${nftInfoPaths}`,
            fastRedeemApiUrl,
        ).toString(),
    );
    if (!response.ok) {
        const errorMessage = {
            responseMessage: await response.text(),
            arguments: JSON.stringify(arguments),
        };
        console.error(errorMessage);
        throw new Error(`API request failed with status: ${errorMessage.responseMessage}`);
    }
    return await response.text();
}

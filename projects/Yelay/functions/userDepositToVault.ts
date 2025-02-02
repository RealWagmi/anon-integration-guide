import { Address, parseUnits } from 'viem';
import {
    FunctionReturn,
    FunctionOptions,
    toResult,
    getChainFromName,
    TransactionParams,
} from '@heyanon/sdk';
import { supportedChains } from '../constants';
import {
    getChainConfig,
    getSdk,
    getStaticProvider,
    validateAddress,
    wrapWithResult,
} from '../utils';

import {
    DepositBagStruct,
    ERC20__factory,
    ISmartVaultManager__factory,
    VaultDetailsQuery,
} from '@spool.fi/spool-v2-sdk';

export interface UserDepositToVaultProps {
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
export async function userDepositToVault(
    { chainName, account, vaultAddress, amount }: UserDepositToVaultProps,
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
    const amountBinInt = BigInt(amount);
    if (amountBinInt <= BigInt(0)) return toResult(`Amount should be a positive number`, true);

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

    const ethersProvider = await wrapWithResult(getStaticProvider)(chainId);
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

    // Approve assets to vault
    const vaultTokenContract = ERC20__factory.connect(
        vaultTokenType.address,
        ethersProvider.result,
    );

    const amountNoDecimals = parseUnits(amountBinInt.toString(), vaultTokenType.decimals);
    const approveTokenToVaultAmountData = vaultTokenContract.interface.encodeFunctionData(
        'approve',
        [vaultAddressValidation.result, amountNoDecimals],
    );

    const vaultTokenAddressValidation = await wrapWithResult(validateAddress)(
        vaultTokenType.address,
    );
    if (!vaultTokenAddressValidation.success) {
        return toResult(`Failed to create tx to approve: invalid vault token address`, true);
    }

    const approveTokenToVaultAmountDataValidation = await wrapWithResult(validateAddress)(
        approveTokenToVaultAmountData,
    );
    if (!approveTokenToVaultAmountDataValidation.success) {
        return toResult(`Failed to create tx to approve: invalid approve tx data`, true);
    }

    const approveTxParams: TransactionParams = {
        target: vaultTokenAddressValidation.result,
        data: approveTokenToVaultAmountDataValidation.result,
    };

    // Deposit assets to vault
    const smartVaultManagerContract = ISmartVaultManager__factory.connect(
        config.result.deployments.ISmartVaultManager,
        ethersProvider.result,
    );

    const depositBag: DepositBagStruct = {
        smartVault: vaultAddressValidation.result,
        assets: [amountNoDecimals],
        receiver: account,
        referral: config.result.functions.deposit.referralAddress,
        doFlush: false,
    };

    const depositAssetsToVaultData = smartVaultManagerContract.interface.encodeFunctionData(
        'deposit',
        [depositBag],
    );
    const depositAssetsToVaultDataValidation =
        await wrapWithResult(validateAddress)(depositAssetsToVaultData);
    if (!depositAssetsToVaultDataValidation.success) {
        return toResult(`Failed to create tx to deposit: invalid deposit tx data`, true);
    }

    const depositToVaultTxParams: TransactionParams = {
        target: vaultAddressValidation.result,
        data: depositAssetsToVaultDataValidation.result,
    };

    // sign and send ts
    await notify(
        `Approving and depositing ${amount} ${vaultTokenType.symbol} in vault ${vaultAddressValidation.result} for account ${account}...`,
    );

    const transactions: Array<TransactionParams> = [approveTxParams, depositToVaultTxParams];
    await sendTransactions({ chainId, account, transactions });

    return toResult(
        `Deposited ${amount} ${vaultTokenType.symbol} in vault ${vaultAddressValidation.result} for account ${account}`,
    );
}

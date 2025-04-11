import { encodeFunctionData, Address } from 'viem';
import { FunctionOptions, EVM, EvmChain } from '@heyanon/sdk';
import { getBeefyChainNameFromAnonChainName } from '../helpers/chains';
import { getSimplifiedVaultByIdAndChain, getVaultWithUserBalance } from '../helpers/vaults';
import { beefyVaultAbi } from '../abis';
import { toHumanReadableAmount } from '../helpers/format';
import { validatePercentage } from './validation';

/**
 * Build the transaction to withdraw liquidity from a vault as a
 * percentage of the deposited balance.
 *
 * Both the token to withdraw and the vault contract address are
 * determined by the vaultId.
 *
 * Returns a tuple with the transaction parameters and the amount
 * of the deposited token that will be withdrawn.
 *
 * Docs: https://docs.beefy.finance/developer-documentation/vault-contract
 */
export async function buildWithdrawTransaction(
    account: Address,
    chainName: string,
    vaultId: string,
    removalPercentage: `${number}` | null,
    { evm: { getProvider }, notify }: FunctionOptions,
): Promise<[EVM.types.TransactionParams, bigint]> {
    // Parse and validate removal percentage
    removalPercentage = removalPercentage ?? `${100}`;
    if (!validatePercentage(removalPercentage)) throw new Error(`Invalid removal percentage: ${removalPercentage}`);

    // Get provider
    const chainId = EVM.utils.getChainFromName(chainName as EvmChain);
    const provider = getProvider(chainId);

    // Fetch the vault info
    const beefyChainName = getBeefyChainNameFromAnonChainName(chainName);
    const vault = await getSimplifiedVaultByIdAndChain(vaultId, beefyChainName);
    if (!vault) throw new Error(`Could not find vault with ID ${vaultId}`);
    const mDecimals = vault.mooTokenDecimals;
    const dDecimals = vault.depositedTokenDecimals;

    // Get user liquidity in the vault
    const vaultWithUserBalance = await getVaultWithUserBalance(vault, account, provider);
    const userLiquidityInWei = vaultWithUserBalance.mooTokenUserBalance as bigint;
    if (userLiquidityInWei === 0n) throw new Error(`You have no liquidity in vault ${vault.name}`);
    notify(
        `You have ${toHumanReadableAmount(vaultWithUserBalance.depositedTokenUserBalance as bigint, dDecimals, dDecimals, dDecimals)} ${vault.depositedTokenSymbol} in vault ${vault.name}, corresponding to ${toHumanReadableAmount(userLiquidityInWei, mDecimals, mDecimals, mDecimals)} mooTokens`,
    );

    // Calculate the amount of liquidity to remove
    let liquidityToRemoveInWei: bigint;
    let depositedTokensToWithdrawInWei: bigint;
    const depositedTokenUserBalance = vaultWithUserBalance.depositedTokenUserBalance as bigint;
    if (removalPercentage === '100') {
        liquidityToRemoveInWei = userLiquidityInWei;
        depositedTokensToWithdrawInWei = depositedTokenUserBalance;
        notify(
            `Will withdraw all of your tokens from the vault, for a total of ${toHumanReadableAmount(depositedTokensToWithdrawInWei, dDecimals)} ${vault.depositedTokenSymbol} tokens`,
        );
    } else {
        liquidityToRemoveInWei = (userLiquidityInWei * BigInt(removalPercentage)) / 100n;
        depositedTokensToWithdrawInWei = (depositedTokenUserBalance * BigInt(removalPercentage)) / 100n;
        notify(
            `Will withdraw ${removalPercentage}% of your tokens from the vault, for a total of ${toHumanReadableAmount(depositedTokensToWithdrawInWei, dDecimals)} ${vault.depositedTokenSymbol} tokens`,
        );
    }

    // Build the withdraw transaction
    const tx = {
        target: vault.vaultContractAddress,
        data: encodeFunctionData({
            abi: beefyVaultAbi,
            functionName: 'withdraw',
            args: [liquidityToRemoveInWei],
        }),
    };

    // Return the withdraw transaction, the token info, and the amount of the deposited token that will be withdrawn
    return [tx, depositedTokensToWithdrawInWei];
}

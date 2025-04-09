import { encodeFunctionData, Address } from 'viem';
import { FunctionOptions, EVM, EvmChain } from '@heyanon/sdk';
import { getBeefyChainNameFromAnonChainName } from '../helpers/chains';
import { getSimplifiedVaultByIdAndChain } from '../helpers/vaults';
import { beefyVaultAbi } from '../abis';
import { toHumanReadableAmount } from '../helpers/format';
import { validatePercentage } from './validation';

/**
 * Build the transaction to withdraw liquidity from a vault as a percentage
 * of the deposited balance.
 *
 * Both the token to withdraw and the vault contract address are
 * determined by the vaultId.
 *
 * Docs: https://docs.beefy.finance/developer-documentation/vault-contract
 */
export async function buildWithdrawTransaction(
    account: Address,
    chainName: string,
    vaultId: string,
    removalPercentage: `${number}` | null,
    { evm: { getProvider }, notify }: FunctionOptions,
): Promise<EVM.types.TransactionParams> {
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
    const decimals = vault.mooTokenDecimals;

    // Get user liquidity in the vault
    const userLiquidityInWei = (await provider.readContract({
        address: vault.vaultContractAddress,
        abi: beefyVaultAbi,
        functionName: 'balanceOf',
        args: [account],
    })) as bigint;
    if (userLiquidityInWei === 0n) throw new Error(`You have no liquidity in vault ${vault.name}`);
    notify(`You have ${toHumanReadableAmount(userLiquidityInWei, decimals, decimals, decimals)} mooTokens in vault ${vault.name}`);

    // Calculate the amount of liquidity to remove
    let liquidityToRemoveInWei;
    if (removalPercentage === '100') {
        liquidityToRemoveInWei = userLiquidityInWei;
        notify(`Will remove all liquidity from the vault`);
    } else {
        liquidityToRemoveInWei = (userLiquidityInWei * BigInt(removalPercentage)) / 100n;
        notify(`Will withdraw ${removalPercentage}% of your mooTokens from the vault, for a total of ${toHumanReadableAmount(liquidityToRemoveInWei, decimals)} mooTokens`);
    }

    // Return the withdraw transaction
    return {
        target: vault.vaultContractAddress,
        data: encodeFunctionData({
            abi: beefyVaultAbi,
            functionName: 'withdraw',
            args: [liquidityToRemoveInWei],
        }),
    };
}

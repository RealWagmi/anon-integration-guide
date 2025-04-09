import { encodeFunctionData, parseUnits, erc20Abi, Address } from 'viem';
import { FunctionOptions, EVM, EvmChain } from '@heyanon/sdk';
import { getBeefyChainNameFromAnonChainName } from '../helpers/chains';
import { getSimplifiedVaultByIdAndChain } from '../helpers/vaults';
import { beefyVaultAbi } from '../abis';
import { toHumanReadableAmount } from '../helpers/format';
import { getTokenInfoFromAddress } from '../helpers/tokens';
import { TokenInfo } from '../helpers/beefyClient';

/**
 * Build the transactions to deposit the specified amount of tokens into a
 * vault.
 *
 * Both the token to deposit and the vault contract address are determined by
 * the vaultId.
 *
 * If the token allowance is enough, only the deposit transaction is returned.
 * Otherwise, two transactions are returned: one to approve the vault and one
 * to deposit the tokens.
 *
 * A check is done to ensure that the token address corresponds to the
 * vault's deposited token.
 *
 * If no token address is provided, the vault's deposited token will be used.
 *
 * Docs: https://docs.beefy.finance/developer-documentation/vault-contract
 */
export async function buildDepositExactTokensTransactions(
    account: Address,
    chainName: string,
    vaultId: string,
    amount: string,
    tokenAddress: `0x${string}` | null,
    { evm: { getProvider }, notify }: FunctionOptions,
): Promise<[EVM.types.TransactionParams[], TokenInfo]> {
    // Get provider
    const chainId = EVM.utils.getChainFromName(chainName as EvmChain);
    const provider = getProvider(chainId);

    // Fetch the vault info
    const beefyChainName = getBeefyChainNameFromAnonChainName(chainName);
    const vault = await getSimplifiedVaultByIdAndChain(vaultId, beefyChainName);
    if (!vault) throw new Error(`Could not find vault with ID ${vaultId}`);

    // Compute the amount in wei
    const amountInWei = parseUnits(amount, vault.depositedTokenDecimals);
    if (amountInWei === 0n) throw new Error('Amount must be greater than 0');

    // Get token address from vault contract
    // We could get it from the API (as vault.depositedTokenAddress), but
    // sometimes (e.g. native chain tokens) the API omits it
    const depositedTokenAddress = (await provider.readContract({
        address: vault.vaultContractAddress as `0x${string}`,
        abi: beefyVaultAbi,
        functionName: 'want',
    })) as `0x${string}`;
    if (!depositedTokenAddress) throw new Error('Could not get token address from vault contract');

    // Get info on the token the vault wants (depositedTokenInfo)
    let depositedTokenInfo: TokenInfo;
    try {
        depositedTokenInfo = await getTokenInfoFromAddress(chainName, depositedTokenAddress);
    } catch (error) {
        throw new Error("Could not get info on vault's deposit token");
    }

    // If the user provided a token address, verify that it matches the
    // vault's deposited token
    if (tokenAddress) {
        let userProvidedTokenInfo: TokenInfo;
        try {
            userProvidedTokenInfo = await getTokenInfoFromAddress(chainName, tokenAddress);
        } catch (error) {
            throw new Error('Could not get info on user provided deposit token');
        }
        // Check that the user is trying to deposit the right token
        if (tokenAddress.toLowerCase() !== depositedTokenAddress.toLowerCase()) {
            throw new Error(
                'You are trying to deposit the wrong token.  The vault wants ' + depositedTokenInfo.id + ' but you are trying to deposit ' + userProvidedTokenInfo.symbol,
            );
        }
    }

    await notify(`Checking your balance of ${depositedTokenInfo.id}...`);

    // Check user balance
    let balance: bigint;
    balance = await provider.readContract({
        address: depositedTokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [account],
    });
    if (balance < amountInWei) {
        let msg = `Not enough tokens: you need ${amount} ${vault.depositedTokenSymbol} but you have ${toHumanReadableAmount(balance, vault.depositedTokenDecimals)}`;
        if (vault.depositedTokenUrl) {
            msg += `\nVisit this URL to acquire the tokens: ${vault.depositedTokenUrl}`;
        }
        throw new Error(msg);
    }

    // Maybe approve token to vault
    const transactions: EVM.types.TransactionParams[] = [];
    await EVM.utils.checkToApprove({
        args: { account, target: depositedTokenAddress, spender: vault.vaultContractAddress, amount: amountInWei },
        provider,
        transactions,
    });

    await notify(`Preparing to deposit ${amount} ${depositedTokenInfo.id} into vault ${vault.name}...`);

    // Prepare deposit transaction
    const tx: EVM.types.TransactionParams = {
        target: vault.vaultContractAddress,
        data: encodeFunctionData({
            abi: beefyVaultAbi,
            functionName: 'deposit',
            args: [amountInWei],
        }),
    };
    transactions.push(tx);

    return [transactions, depositedTokenInfo];
}

import { Address } from 'viem';
import { FunctionReturn, FunctionOptions, toResult, EVM, EvmChain } from '@heyanon/sdk';
import { supportedChains } from '../constants';
import { buildDepositExactTokensTransactions } from '../helpers/deposit';
import { TokenInfo } from '../helpers/beefyClient';
import { getSimplifiedVaultByIdAndChain, getDepositedTokenPrice } from '../helpers/vaults';
import { to$$$ } from '../helpers/format';

interface Props {
    chainName: string;
    account: Address;
    vaultId: string;
    dollarAmount: number;
}

/**
 * Deposit tokens into a vault for the value in USD given in `dollarAmount`.
 * The token to deposit and the vault contract address are determined by the
 * vaultId.
 *
 * Docs: https://docs.beefy.finance/developer-documentation/vault-contract
 *
 * @param {Object} props - The function input parameters
 * @param {string} props.chainName - Name of the blockchain netìwork
 * @param {Address} props.account - The user's address that will deposit tokens
 * @param {string} props.vaultId - The ID of the vault to deposit into, for example "beetsv3-sonic-beefyusdce-scusd"
 * @param {string} props.dollarAmount - The amount of tokens to deposit, in decimal format
 * @returns {Promise<FunctionReturn>} A message confirming the deposit or an error description
 */
export async function depositDollarAmount({ chainName, account, vaultId, dollarAmount }: Props, options: FunctionOptions): Promise<FunctionReturn> {
    const chainId = EVM.utils.getChainFromName(chainName as EvmChain);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Beets protocol is not supported on ${chainName}`, true);
    if (dollarAmount <= 0) return toResult(`Dollar amount must be greater than 0`, true);

    // Get vault info
    const vault = await getSimplifiedVaultByIdAndChain(vaultId, chainName);
    if (!vault) return toResult(`Could not find vault with ID ${vaultId}`, true);

    // Get the amount of tokens to deposit
    const vaultDepositedTokenPrice = await getDepositedTokenPrice(vault);
    const amount = dollarAmount / vaultDepositedTokenPrice;
    options.notify(`Will attempt to deposit ${to$$$(dollarAmount, 2, 6)} worth of tokens in vault ${vault.name} (${amount} ${vault.depositedTokenSymbol} tokens).`);

    // Build the transactions that need to be sent
    let transactions: EVM.types.TransactionParams[] = [];
    let depositedTokenInfo: TokenInfo;
    try {
        [transactions, depositedTokenInfo] = await buildDepositExactTokensTransactions(account, chainName, vaultId, amount.toString(), null, options);
    } catch (error) {
        return toResult(error instanceof Error ? error.message : 'An unknown error occurred', true);
    }

    if (transactions.length === 1) {
        await options.notify('Sending deposit transaction...');
    } else if (transactions.length > 1) {
        await options.notify('Sending approval & deposit transactions...');
    }

    const result = await options.evm.sendTransactions({ chainId, account, transactions });
    const message = result.data[result.data.length - 1].message;
    return toResult(
        result.isMultisig
            ? message
            : `Successfully deposited ${to$$$(dollarAmount, 2, 6)} worth of tokens in vault ${vault.name} (${amount} ${depositedTokenInfo.id} tokens). ${message}`,
    );
}

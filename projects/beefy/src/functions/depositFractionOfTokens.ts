import { Address, erc20Abi, formatUnits } from 'viem';
import { FunctionReturn, FunctionOptions, toResult, EVM, EvmChain } from '@heyanon/sdk';
import { supportedChains } from '../constants';
import { buildDepositExactTokensTransactions } from '../helpers/deposit';
import { TokenInfo } from '../helpers/beefyClient';
import { validatePercentage } from '../helpers/validation';
import { getBeefyChainNameFromAnonChainName } from '../helpers/chains';
import { getDepositedTokenAddress, getSimplifiedVaultByIdAndChain } from '../helpers/vaults';
import { toHumanReadableAmount } from '../helpers/format';

interface Props {
    chainName: string;
    account: Address;
    vaultId: string;
    percentage: string;
}

/**
 * Deposit a percentage of the user's tokens into a vault.  Both the token to
 * deposit and the vault contract address are determined by the vaultId.
 *
 * Docs: https://docs.beefy.finance/developer-documentation/vault-contract
 *
 * @param {Object} props - The function input parameters
 * @param {string} props.chainName - Name of the blockchain netìwork
 * @param {Address} props.account - The user's address that will deposit tokens
 * @param {string} props.vaultId - The ID of the vault to deposit into, for example "beetsv3-sonic-beefyusdce-scusd"
 * @param {string} props.percentage - The percentage of the user's tokens to deposit, expressed as a string (e.g. "50" for 50%)
 * @param {FunctionOptions} options - Holds EVM utilities and a notifier
 * @returns {Promise<FunctionReturn>} A message confirming the deposit or an error description
 */
export async function depositFractionOfTokens({ chainName, account, vaultId, percentage }: Props, options: FunctionOptions): Promise<FunctionReturn> {
    const chainId = EVM.utils.getChainFromName(chainName as EvmChain);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Beets protocol is not supported on ${chainName}`, true);

    // Parse and validate removal percentage
    if (!validatePercentage(percentage)) throw new Error(`Invalid percentage: ${percentage}`);

    // Get balance of user in the vault token
    const provider = options.evm.getProvider(chainId);
    const beefyChainName = getBeefyChainNameFromAnonChainName(chainName);
    const vault = await getSimplifiedVaultByIdAndChain(vaultId, beefyChainName);
    if (!vault) throw new Error(`Could not find vault with ID ${vaultId}`);
    const depositedTokenAddress = await getDepositedTokenAddress(vault, provider);
    const userBalance = await provider.readContract({ address: depositedTokenAddress, abi: erc20Abi, functionName: 'balanceOf', args: [account] });

    // Calculate the amount of tokens to deposit
    let amountToDepositInWei;
    if (percentage === '100') {
        amountToDepositInWei = userBalance;
        options.notify(
            `Will deposit all of your ${vault.depositedTokenSymbol} tokens into the vault (${toHumanReadableAmount(amountToDepositInWei, vault.depositedTokenDecimals)})`,
        );
    } else {
        amountToDepositInWei = (userBalance * BigInt(percentage)) / 100n;
        options.notify(
            `Will deposit ${percentage}% of your ${vault.depositedTokenSymbol} tokens into the vault, for a total of ${toHumanReadableAmount(amountToDepositInWei, vault.depositedTokenDecimals)} ${vault.depositedTokenSymbol}`,
        );
    }

    // Build the transactions that need to be sent
    let transactions: EVM.types.TransactionParams[] = [];
    let depositedTokenInfo: TokenInfo;
    try {
        [transactions, depositedTokenInfo] = await buildDepositExactTokensTransactions(
            account,
            chainName,
            vaultId,
            formatUnits(amountToDepositInWei, vault.depositedTokenDecimals),
            depositedTokenAddress,
            options,
        );
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
            : `Successfully deposited ${formatUnits(amountToDepositInWei, vault.depositedTokenDecimals)} ${depositedTokenInfo.id} tokens in the vault. ${message}`,
    );
}

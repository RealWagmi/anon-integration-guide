import { Address } from 'viem';
import { FunctionReturn, FunctionOptions, toResult, EVM, EvmChain } from '@heyanon/sdk';
import { supportedChains } from '../constants';
import { buildtExactTokensTransactions } from '../helpers/deposit';
import { TokenInfo } from '../helpers/beefyClient';

interface Props {
    chainName: string;
    account: Address;
    vaultId: string;
    amount: string;
    tokenAddress: `0x${string}`;
}

/**
 * Deposit the specified amount of tokens into a vault.  Both the token to
 * deposit and the vault contract address are determined by the vaultId.
 *
 * Docs: https://docs.beefy.finance/developer-documentation/vault-contract
 *
 * @param {Object} props - The function input parameters
 * @param {string} props.chainName - Name of the blockchain netìwork
 * @param {Address} props.account - The user's address that will deposit tokens
 * @param {string} props.vaultId - The ID of the vault to deposit into, for example "beetsv3-sonic-beefyusdce-scusd"
 * @param {string} props.amount - The amount of tokens to deposit, in decimal format
 * @param {string} props.tokenAddress - The address of the token to deposit, starting with "0x"; used to check that the user is not trying to deposit the wrong token
 * @param {FunctionOptions} context - Holds EVM utilities and a notifier
 * @returns {Promise<FunctionReturn>} A message confirming the deposit or an error description
 */
export async function depositExactTokens({ chainName, account, vaultId, amount, tokenAddress }: Props, options: FunctionOptions): Promise<FunctionReturn> {
    const chainId = EVM.utils.getChainFromName(chainName as EvmChain);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Beets protocol is not supported on ${chainName}`, true);

    // Build the transactions that need to be sent
    let transactions: EVM.types.TransactionParams[] = [];
    let depositedTokenInfo: TokenInfo;
    try {
        [transactions, depositedTokenInfo] = await buildtExactTokensTransactions(account, chainName, vaultId, amount, tokenAddress, options);
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
    return toResult(result.isMultisig ? message : `Successfully deposited ${amount} ${depositedTokenInfo.id}. ${message}`);
}

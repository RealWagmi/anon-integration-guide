import { Address } from 'viem';
import { FunctionReturn, FunctionOptions, toResult, EVM, EvmChain } from '@heyanon/sdk';
import { supportedChains } from '../constants';
import { buildWithdrawTransaction } from '../helpers/withdraw';

interface Props {
    chainName: string;
    account: Address;
    vaultId: string;
    removalPercentage: `${number}` | null;
}

/**
 * Withdraw a percentage of the user's mooTokens from a vault.
 *
 * Docs: https://docs.beefy.finance/developer-documentation/vault-contract
 *
 * @param {Object} props - The function input parameters
 * @param {string} props.chainName - Name of the blockchain netìwork
 * @param {Address} props.account - The user's address that will deposit tokens
 * @param {string} props.vaultId - The ID of the vault to deposit into, for example "beetsv3-sonic-beefyusdce-scusd"
 * @param {string} props.removalPercentage - The percentage of mooTokens to withdraw, as a number between 0 and 100
 * @param {FunctionOptions} options - Holds EVM utilities and a notifier
 * @returns {Promise<FunctionReturn>} A message confirming the withdrawal or an error description
 */
export async function withdraw({ chainName, account, vaultId, removalPercentage }: Props, options: FunctionOptions): Promise<FunctionReturn> {
    const chainId = EVM.utils.getChainFromName(chainName as EvmChain);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Beets protocol is not supported on ${chainName}`, true);

    // Build the transaction that needs to be sent
    let transaction: EVM.types.TransactionParams;
    try {
        transaction = await buildWithdrawTransaction(account, chainName, vaultId, removalPercentage, options);
    } catch (error) {
        return toResult(error instanceof Error ? error.message : 'An unknown error occurred', true);
    }

    await options.notify('Sending withdrawal transaction...');

    const result = await options.evm.sendTransactions({ chainId, account, transactions: [transaction] });
    const message = result.data[result.data.length - 1].message;
    return toResult(result.isMultisig ? message : `Successfully withdrew ${removalPercentage ?? '100'}% of your liquidity from the vault. ${message}`);
}

import { ChainId, FunctionOptions, toResult, TransactionParams } from '@heyanon/sdk';
import { Address, encodeFunctionData, formatUnits, parseUnits } from 'viem';
import { ichiVaults } from '../../constants';
import { ichiVaultAbi } from '../../abis/ichiVaultAbi';

interface Props {
    account: Address;
    vault: Address;
    amount: string;
}

export async function removeLiquidity({ account, vault, amount }: Props, { sendTransactions, notify, getProvider }: FunctionOptions) {
    if (!account) return toResult('Wallet not connected', true);

    await notify('Preparing to remove liquidity from SwapX...');

    const vaultFound = ichiVaults.find((i) => i.vault === vault);
    if (!vaultFound) return toResult('Vault not found', true);

    const chainId = ChainId.SONIC;

    const provider = getProvider(chainId);

    const amountInWei = parseUnits(amount, 18);

    const amountBalance = (await provider.readContract({
        address: vaultFound.vault,
        abi: ichiVaultAbi,
        functionName: 'balanceOf',
        args: [account],
    })) as bigint;

    if (amountBalance < amountInWei) return toResult(`Insufficient tokens balance, Has ${formatUnits(amountBalance, 18)} Needs ${amount}`, true);

    const transactions: TransactionParams[] = [];

    // Remove LP
    transactions.push({
        target: vaultFound.vault,
        data: encodeFunctionData({ abi: ichiVaultAbi, functionName: 'withdraw', args: [amountInWei, account] }),
    });

    await notify('Waiting for transaction confirmation...');

    const result = await sendTransactions({ chainId, account, transactions });
    const withdrawMessage = result.data[result.data.length - 1];
    const constructedMessage = `Successfully removed ${amount} LP from SwapX. ${withdrawMessage.message}`;

    return toResult(constructedMessage, false);
}

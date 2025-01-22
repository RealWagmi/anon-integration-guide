import { ChainId, checkToApprove, FunctionOptions, toResult, TransactionParams } from '@heyanon/sdk';
import { Address, encodeFunctionData, erc20Abi, formatUnits, parseUnits } from 'viem';
import { ichiVaults } from '../../constants';
import { gaugeV2CLAbi } from '../../abis/gaugeV2CLAbi';

interface Props {
    account: Address;
    vault: Address;
    amount: string;
}

export async function stakeLP({ account, vault, amount }: Props, { sendTransactions, notify, getProvider }: FunctionOptions) {
    if (!account) return toResult('Wallet not connected', true);

    await notify('Preparing to stake liquidity to SwapX...');

    const vaultFound = ichiVaults.find((i) => i.vault === vault);
    if (!vaultFound) return toResult('Vault not found', true);

    const chainId = ChainId.SONIC;

    const provider = getProvider(chainId);

    const amountInWei = parseUnits(amount, 18);

    // Validate token balance
    const tokenBalance = await provider.readContract({
        address: vault,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [account],
    });

    if (tokenBalance < amountInWei) return toResult(`Insufficient vault token balance, Has ${formatUnits(tokenBalance, 18)} Needs ${amount}`, true);

    const transactions: TransactionParams[] = [];

    // Check and prepare approve transaction if needed
    await checkToApprove({
        args: {
            account,
            target: vault,
            spender: vaultFound.gauge,
            amount: amountInWei,
        },
        provider,
        transactions,
    });

    // Stake LP
    transactions.push({
        target: vaultFound.gauge,
        data: encodeFunctionData({
            abi: gaugeV2CLAbi,
            functionName: 'deposit',
            args: [amountInWei],
        }),
    });

    await notify('Waiting for transaction confirmation...');

    const result = await sendTransactions({ chainId, account, transactions });
    const depositMessage = result.data[result.data.length - 1];
    const constructedMessage = `Successfully staked ${amount} LP to SwapX. ${depositMessage.message}`;

    return toResult(result.isMultisig ? depositMessage.message : constructedMessage);
}

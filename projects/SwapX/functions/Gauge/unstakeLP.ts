import { ChainId, FunctionOptions, toResult, TransactionParams } from '@heyanon/sdk';
import { Address, encodeFunctionData, erc20Abi, formatUnits, parseUnits } from 'viem';
import { ichiVaults } from '../../constants';
import { gaugeV2CLAbi } from '../../abis/gaugeV2CLAbi';

interface Props {
    account: Address;
    vault: Address;
    amount: string;
}

export async function unstakeLP({ account, vault, amount }: Props, { sendTransactions, notify, getProvider }: FunctionOptions) {
    if (!account) return toResult('Wallet not connected', true);

    await notify('Preparing to unstake liquidity from gauge on SwapX...');

    const vaultFound = ichiVaults.find((i) => i.vault === vault);
    if (!vaultFound) return toResult('Vault not found', true);

    const chainId = ChainId.SONIC;

    const provider = getProvider(chainId);

    const amountInWei = parseUnits(amount, 18);

    // Validate token balance
    const tokenBalance = await provider.readContract({
        address: vaultFound.gauge,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [account],
    });

    if (tokenBalance < amountInWei) return toResult(`Insufficient gauge token balance, Has ${formatUnits(tokenBalance, 18)} Needs ${amount}`, true);

    const transactions: TransactionParams[] = [];

    // Unstake LP
    transactions.push({
        target: vaultFound.gauge,
        data: encodeFunctionData({
            abi: gaugeV2CLAbi,
            functionName: 'withdraw',
            args: [amountInWei],
        }),
    });

    await notify('Waiting for transaction confirmation...');

    const result = await sendTransactions({ chainId, account, transactions });
    const withdrawMessage = result.data[result.data.length - 1];
    const constructedMessage = `Successfully unstaked ${amount} LP from gauge on SwapX. ${withdrawMessage.message}`;

    return toResult(result.isMultisig ? withdrawMessage.message : constructedMessage);
}

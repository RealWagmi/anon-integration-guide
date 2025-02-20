import { ChainId, FunctionOptions, toResult, TransactionParams } from '@heyanon/sdk';
import { Address, encodeFunctionData, erc20Abi, formatUnits, parseUnits } from 'viem';
import { ichiVaults } from '../../constants';
import { gaugeV2CLAbi } from '../../abis/gaugeV2CLAbi';

interface Props {
    account: Address;
    vault: Address;
}

export async function unstakeAllLPAndHarvest({ account, vault }: Props, { sendTransactions, notify, getProvider }: FunctionOptions) {
    if (!account) return toResult('Wallet not connected', true);

    await notify('Preparing to unstake all liquidity and harvest rewards from gauge on SwapX...');

    const vaultFound = ichiVaults.find((i) => i.vault === vault);
    if (!vaultFound) return toResult('Vault not found', true);

    const chainId = ChainId.SONIC;

    const provider = getProvider(chainId);

    // Validate token balance
    const tokenBalance = await provider.readContract({
        address: vaultFound.gauge,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [account],
    });

    if (tokenBalance == 0n) return toResult(`No LP tokens staked in gauge`, true);

    const pendingRewards = (await provider.readContract({
        address: vaultFound.gauge,
        abi: gaugeV2CLAbi,
        functionName: 'earned',
        args: [account],
    })) as bigint;

    const transactions: TransactionParams[] = [];

    // Unstake LP and harvest rewards
    transactions.push({
        target: vaultFound.gauge,
        data: encodeFunctionData({
            abi: gaugeV2CLAbi,
            functionName: 'withdrawAllAndHarvest',
        }),
    });

    await notify('Waiting for transaction confirmation...');

    const result = await sendTransactions({ chainId, account, transactions });
    const withdrawMessage = result.data[result.data.length - 1];
    const constructedMessage = `Successfully unstaked ${formatUnits(tokenBalance, 18)} LP ${formatUnits(pendingRewards, 18)} SWPx from gauge on SwapX. ${withdrawMessage.message}`;

    return toResult(result.isMultisig ? withdrawMessage.message : constructedMessage);
}

import { ChainId, FunctionOptions, toResult, TransactionParams } from '@heyanon/sdk';
import { Address, encodeFunctionData, formatUnits } from 'viem';
import { ichiVaults } from '../../constants';
import { gaugeV2CLAbi } from '../../abis/gaugeV2CLAbi';

interface Props {
    account: Address;
    vault: Address;
}

export async function claimRewards({ account, vault }: Props, { sendTransactions, notify, getProvider }: FunctionOptions) {
    if (!account) return toResult('Wallet not connected', true);

    await notify('Preparing to claim rewards from gauge on SwapX...');

    const vaultFound = ichiVaults.find((i) => i.vault === vault);
    if (!vaultFound) return toResult('Vault not found', true);

    const chainId = ChainId.SONIC;

    const provider = getProvider(chainId);

    const pendingRewards = (await provider.readContract({
        address: vaultFound.gauge,
        abi: gaugeV2CLAbi,
        functionName: 'earned',
        args: [account],
    })) as bigint;
    if (pendingRewards === 0n) return toResult('No rewards to claim', true);

    // Claim rewards
    const transactions: TransactionParams[] = [
        {
            target: vaultFound.gauge,
            data: encodeFunctionData({
                abi: gaugeV2CLAbi,
                functionName: 'getReward',
            }),
        },
    ];

    await notify('Waiting for transaction confirmation...');
    const result = await sendTransactions({ chainId, account, transactions });
    const depositMessage = result.data[result.data.length - 1];
    const constructedMessage = `Successfully claimed ${formatUnits(pendingRewards, 18)} SWPx rewards from SwapX. ${depositMessage.message}`;

    return toResult(result.isMultisig ? depositMessage.message : constructedMessage);
}

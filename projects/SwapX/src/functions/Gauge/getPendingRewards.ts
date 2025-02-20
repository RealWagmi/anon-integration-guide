import { ChainId, FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { Address, formatUnits } from 'viem';
import { gaugeV2CLAbi } from '../../abis/gaugeV2CLAbi';
import { ichiVaults } from '../../constants';

interface Props {
    account: Address;
    vault: Address;
}

export async function getPendingRewards({ account, vault }: Props, { getProvider }: FunctionOptions): Promise<FunctionReturn> {
    if (!account) return toResult('Wallet not connected', true);

    const publicClient = getProvider(ChainId.SONIC);

    const vaultFound = ichiVaults.find((i) => i.vault === vault);
    if (!vaultFound) return toResult('Vault not found', true);

    const earned = (await publicClient.readContract({
        address: vaultFound.gauge,
        abi: gaugeV2CLAbi,
        functionName: 'earned',
        args: [account],
    })) as bigint;

    return toResult(`Pending SWPx rewards: ${formatUnits(earned, 18)} SWPx`);
}

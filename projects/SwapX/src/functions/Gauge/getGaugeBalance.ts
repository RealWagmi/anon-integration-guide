import { ChainId, FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { Address, formatUnits } from 'viem';
import { gaugeV2CLAbi } from '../../abis/gaugeV2CLAbi';
import { ichiVaults } from '../../constants';

interface Props {
    account: Address;
    vault: Address;
}

export async function getGaugeBalance({ account, vault }: Props, { getProvider }: FunctionOptions): Promise<FunctionReturn> {
    if (!account) return toResult('Wallet not connected', true);

    const publicClient = getProvider(ChainId.SONIC);

    const vaultFound = ichiVaults.find((i) => i.vault === vault);
    if (!vaultFound) return toResult('Vault not found', true);

    const balance = (await publicClient.readContract({
        address: vaultFound.gauge,
        abi: gaugeV2CLAbi,
        functionName: 'balanceOf',
        args: [account],
    })) as bigint;

    return toResult(`Gauge balance: ${formatUnits(balance, 18)} LP`);
}

import { ChainId, FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { Address, formatUnits } from 'viem';
import { ichiVaults } from '../../constants';
import { ichiVaultAbi } from '../../abis/ichiVaultAbi';

interface Props {
    account: Address;
    vault: Address;
}

export async function getLiquidityBalance({ account, vault }: Props, { getProvider }: FunctionOptions): Promise<FunctionReturn> {
    if (!account) return toResult('Wallet not connected', true);

    const publicClient = getProvider(ChainId.SONIC);

    const vaultFound = ichiVaults.find((i) => i.vault === vault);
    if (!vaultFound) return toResult('Vault not found', true);

    const balance = (await publicClient.readContract({
        address: vaultFound.gauge,
        abi: ichiVaultAbi,
        functionName: 'balanceOf',
        args: [account],
    })) as bigint;

    return toResult(`LP balance: ${formatUnits(balance, 18)} LP`);
}

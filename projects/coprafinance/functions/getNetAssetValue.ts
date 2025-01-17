import { Address } from 'viem';
import { FunctionReturn, FunctionOptions, toResult, getChainFromName } from '@heyanon/sdk';
import { supportedChains, VAULTS } from '../constants';
import contractAbi from '../abis/copra-finance.json';

interface Props {
    chainName: string;
    vaultName: string;
}

export async function getNetAssetValue(
    { chainName, vaultName }: Props,
    { getProvider }: FunctionOptions
): Promise<FunctionReturn> {
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId))
        return toResult(`Protocol is not supported on ${chainName}`, true);

    const vaultAddress = VAULTS[chainId].find(vault => vault.name === vaultName)?.address as `0x${string}`;
    const provider = getProvider(chainId);

    try {
        const nav = await provider.readContract({
            address: vaultAddress,
            abi: contractAbi,
            functionName: 'getNetAssetValue'
        });

        return toResult(nav.toString());
    } catch (error) {
        return toResult(`Failed to get net asset value: ${error}`, true);
    }
} 
import { FunctionReturn, FunctionOptions, toResult, getChainFromName } from '@heyanon/sdk';
import { Vault } from '../types/vault';

interface Props {
    chainName: string;
    protocolName: string;
    assets: string;
}

/**
 * Gets the vaults that match the type and tokens provided.
 * @param props - The function parameters
 * @param tools - System tools for blockchain interactions
 * @returns Matching vaults in a JSON format
 */
export async function getMatchingVaults({ chainName, protocolName, assets }: Props, {}: FunctionOptions): Promise<FunctionReturn> {
    // Validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);

    // Split assets into array
    const assetsArray = assets.split(',');

    // Fetch vaults
    const res = await fetch('https://api.beefy.finance/vaults');
    const allVaults: Vault[] = await res.json();

    // Filter vaults
    const matchingChain = allVaults.filter((vault) => vault.chain == chainName.toLowerCase());
    const matchingProtocol = matchingChain.filter((vault) => vault.platformId == protocolName.toLowerCase());
    const matchingAssets = matchingProtocol.filter((vault) => assetsArray.every((asset) => vault.assets.includes(asset)));

    // Get vaults
    matchingAssets.map((vault) => {
        return {
            id: vault.id,
            name: vault.name,
            type: vault.type,
            tokenToDeposit: vault.token,
            tokenToDepositAddress: vault.tokenAddress,
        };
    });

    // If there are no vaults, throw
    if (matchingAssets.length === 0) return toResult(`No vaults found for ${chainName} and ${protocolName} with assets ${assetsArray.join(', ')}`, true);

    // Loop through and adjust the vaults to fit within the token limit
    for (let i = matchingAssets.length; i > 0; i--) {
        const result = JSON.stringify(matchingAssets.slice(0, i));

        // Early return if the result is less than 500 tokens
        if (result.length < 500) return toResult(result);
    }

    // This should never happen unless the name or token of the vault exceeds 300 characters
    return toResult(`Error: Result exceeds 500 tokens`, true);
}

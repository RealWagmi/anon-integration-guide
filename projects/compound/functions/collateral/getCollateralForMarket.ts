import { Address, formatUnits } from 'viem';
import { FunctionReturn, toResult, getChainFromName, FunctionOptions } from '@heyanon/sdk';
import { comets, supportedChains, collateralAssets } from '../../constants';
import { cometAbi } from '../../abis/cometAbi';

interface Props {
    chainName: string;
    account: Address;
    baseAsset: string;
}

export async function getCollateralForMarket({ chainName, account, baseAsset }: Props, { getProvider }: FunctionOptions): Promise<FunctionReturn> {
    // validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Protocol is not supported on ${chainName}`, true);

    // validate market
    if (!comets[chainId][baseAsset]) return toResult(`Unsupported market: ${baseAsset}. Supported markets include: ${Object.keys(comets[chainId]).join(', ')}`, true);
    const marketAddress = comets[chainId][baseAsset].address;

    const publicClient = getProvider(chainId);

    let supplyMessage = `${baseAsset} market collateral:`;
    for (const collateralAsset of Object.keys(comets[chainId][baseAsset])) {
        const collateralAssetAddress = collateralAssets[chainId][collateralAsset];
        const amountSupplied = await publicClient.readContract({
            address: marketAddress,
            abi: cometAbi,
            functionName: 'userCollateral',
            args: [collateralAssetAddress, account],
        })[0];

        if (amountSupplied === 0n) continue;
        supplyMessage += `\n${collateralAsset}: ${formatUnits(amountSupplied, 18)} `;
    }

    return toResult(supplyMessage);
}

import { Address, erc20Abi, zeroAddress } from 'viem';
import { EVM, EvmChain, FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { supportedChains, ASSET_REGISTRY_ADDRESS } from '../constants';
import { assetRegistryAbi } from '../abis';
const { getChainFromName } = EVM.utils;

interface Props {
    chainName: string;
    token: string;
}
/**
 * Fetch daily points for a supported asset.
 * @param props - The request parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Daily points.
 */
export async function getPointsForAsset({ chainName, token }: Props, options: FunctionOptions): Promise<FunctionReturn> {
    const {
		evm: { getProvider },
		notify,
	} = options;

    // Validate chain
	const chainId = getChainFromName(chainName as EvmChain);
	if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
	if (!supportedChains.includes(chainId)) return toResult(`Kernel is not supported on ${chainName}`, true);

    // Normalize input token
    token = token.toUpperCase();

    await notify('Searching...');

    // Searching through array for a given asset
    const provider = getProvider(chainId);

    const managedAssets = await provider.readContract({
        address: ASSET_REGISTRY_ADDRESS,
        abi: assetRegistryAbi,
        functionName: 'getAssets',
    }) as Address[];

    let assetAddress: Address = zeroAddress;
    for (const asset of managedAssets) {
        const assetSymbol = await provider.readContract({
            address: asset,
            abi: erc20Abi,
            functionName: 'symbol',
        });
        if (assetSymbol.toUpperCase() === token) {
            assetAddress = asset;
            break;
        }
    }
    if (assetAddress === zeroAddress) return toResult('The asset is not supported', true);

    let points = 0;
    if (token === "BNBX" || token === "SLISBNB") {
        points = 2.6;
    } else if (token.includes("BTC")) {
        points = 260;
    } else if (token.includes("BNB")) {
        points = 2;
    }
    return toResult(`Daily points per 1 ${token}: ${points}`);
}
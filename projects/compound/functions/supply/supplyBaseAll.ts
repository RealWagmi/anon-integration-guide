import { Address, erc20Abi, formatEther } from 'viem';
import { FunctionReturn, FunctionOptions, toResult, getChainFromName } from '@heyanon/sdk';
import { type Props, supplyInternal } from '../internal/supplyInternal';
import { comets, collateralAssets, supportedChains } from '../../constants';

export interface SupplyBaseProps {
    chainName: string;
    account: Address;
    baseAsset: string;
}

export async function supplyBaseAll(props: SupplyBaseProps, functionOptions: FunctionOptions): Promise<FunctionReturn> {
    // check wallet connection
    if (!props.account) return toResult('Wallet not connected', true);

    // validate chain
    const chainId = getChainFromName(props.chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${props.chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Protocol is not supported on ${props.chainName}`, true);

    // validate market
    if (!comets[chainId][props.baseAsset]) return toResult(`Unsupported market: ${props.baseAsset}. Supported markets include: ${Object.keys(comets[chainId]).join(', ')}`, true);
    const baseAssetAddress = collateralAssets[chainId][props.baseAsset];

    // get balance
    const provider = functionOptions.getProvider(chainId);
    const balance = await provider.readContract({
        address: baseAssetAddress,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [props.account],
    });

    if (balance === 0n) return toResult('No balance to supply', true);

    const supplyBaseProps: Props = {
        ...props,
        supplyAsset: props.baseAsset,
        amount: formatEther(balance),
    };

    return supplyInternal(supplyBaseProps, functionOptions);
}

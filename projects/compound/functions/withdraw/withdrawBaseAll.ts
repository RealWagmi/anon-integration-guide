import { Address, erc20Abi, formatEther } from 'viem';
import { FunctionReturn, FunctionOptions, toResult, getChainFromName } from '@heyanon/sdk';
import { type Props, withdrawInternal } from '../internal/withdrawInternal';
import { comets, collateralAssets, supportedChains } from '../../constants';

export interface WithdrawBaseProps {
    chainName: string;
    account: Address;
    baseAsset: string;
}

export async function withdrawBaseAll(props: WithdrawBaseProps, functionOptions: FunctionOptions): Promise<FunctionReturn> {
    // check wallet connection
    if (!props.account) return toResult('Wallet not connected', true);

    // validate chain
    const chainId = getChainFromName(props.chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${props.chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Protocol is not supported on ${props.chainName}`, true);

    // validate market
    if (!comets[chainId][props.baseAsset]) return toResult(`Unsupported market: ${props.baseAsset}. Supported markets include: ${Object.keys(comets[chainId]).join(', ')}`, true);
    const cometAddress = comets[chainId][props.baseAsset].address;

    // get balance
    const provider = functionOptions.getProvider(chainId);
    const balance = await provider.readContract({
        address: cometAddress,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [props.account],
    });

    if (balance === 0n) return toResult('No balance to withdraw', true);

    const supplyBaseProps: Props = {
        ...props,
        supplyAsset: props.baseAsset,
        amount: formatEther(balance),
    };

    return withdrawInternal(supplyBaseProps, functionOptions);
}

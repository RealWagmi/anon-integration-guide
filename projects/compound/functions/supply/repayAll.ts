import { Address, formatUnits } from 'viem';
import { FunctionReturn, toResult, getChainFromName, FunctionOptions } from '@heyanon/sdk';
import { comets, supportedChains } from '../../constants';
import { cometAbi } from '../../abis/cometAbi';
import { type Props, supplyInternal } from '../internal/supplyInternal';

export interface RepayAllProps {
    chainName: string;
    account: Address;
    baseAsset: string;
}

export async function repayAll(props: RepayAllProps, functionOptions: FunctionOptions): Promise<FunctionReturn> {
    // validate chain
    const chainId = getChainFromName(props.chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${props.chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Protocol is not supported on ${props.chainName}`, true);

    // validate market
    if (!comets[chainId][props.baseAsset]) return toResult(`Unsupported market: ${props.baseAsset}. Supported markets include: ${Object.keys(comets[chainId]).join(', ')}`, true);
    const marketAddress = comets[chainId][props.baseAsset].address;

    const publicClient = functionOptions.getProvider(chainId);
    const amountBorrowed = await publicClient.readContract({
        address: marketAddress,
        abi: cometAbi,
        functionName: 'borrowBalanceOf',
        args: [props.account],
    });

    // overshoot by 1 bip as interest accrues before transaction is included
    const overshootAmount = amountBorrowed / 10000n;
    const total = amountBorrowed + overshootAmount;

    const repayProps: Props = {
        ...props,
        supplyAsset: props.baseAsset,
        amount: formatUnits(total, 18),
    };

    return supplyInternal(repayProps, functionOptions);
}

import { Address } from 'viem';
import { FunctionReturn, FunctionOptions } from '@heyanon/sdk';
import { type Props, supplyInternal } from '../internal/supplyInternal';

export interface SupplyBaseProps {
    chainName: string;
    account: Address;
    baseAsset: string;
    amount: string;
}

export async function supplyBase(props: SupplyBaseProps, functionOptions: FunctionOptions): Promise<FunctionReturn> {
    const supplyBaseProps: Props = {
        ...props,
        supplyAsset: props.baseAsset,
    };

    return supplyInternal(supplyBaseProps, functionOptions);
}

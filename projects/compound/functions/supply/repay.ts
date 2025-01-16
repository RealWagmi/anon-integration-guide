import { Address } from 'viem';
import { FunctionReturn, FunctionOptions } from '@heyanon/sdk';
import { type Props, supplyInternal } from '../internal/supplyInternal';

export interface RepayProps {
    chainName: string;
    account: Address;
    baseAsset: string;
    amount: string;
}

export async function repay(props: RepayProps, functionOptions: FunctionOptions): Promise<FunctionReturn> {
    const repayProps: Props = {
        ...props,
        supplyAsset: props.baseAsset,
    };

    return supplyInternal(repayProps, functionOptions);
}

import { Address } from 'viem';
import { FunctionReturn, FunctionOptions } from '@heyanon/sdk';
import { type Props, withdrawInternal } from '../internal/withdrawInternal';

export interface BorrowProps {
    chainName: string;
    account: Address;
    baseAsset: string;
    amount: string;
}

export async function borrow(props: BorrowProps, functionOptions: FunctionOptions): Promise<FunctionReturn> {
    const borrowProps: Props = {
        ...props,
        supplyAsset: props.baseAsset,
        amount: props.amount,
    };

    return withdrawInternal(borrowProps, functionOptions);
}

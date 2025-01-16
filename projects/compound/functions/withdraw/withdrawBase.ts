import { Address } from 'viem';
import { FunctionReturn, FunctionOptions } from '@heyanon/sdk';
import { type Props, withdrawInternal } from '../internal/withdrawInternal';

export interface WithdrawBaseProps {
    chainName: string;
    account: Address;
    baseAsset: string;
    amount: string;
}

export async function withdrawBase(props: WithdrawBaseProps, functionOptions: FunctionOptions): Promise<FunctionReturn> {
    const withdrawBaseProps: Props = {
        ...props,
        supplyAsset: props.baseAsset,
    };

    return withdrawInternal(withdrawBaseProps, functionOptions);
}

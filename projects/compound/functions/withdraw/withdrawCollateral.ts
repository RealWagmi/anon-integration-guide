import { FunctionReturn, FunctionOptions } from '@heyanon/sdk';
import { type Props, withdrawInternal } from '../internal/withdrawInternal';

export async function withdrawCollateral(props: Props, functionOptions: FunctionOptions): Promise<FunctionReturn> {
    return withdrawInternal(props, functionOptions);
}

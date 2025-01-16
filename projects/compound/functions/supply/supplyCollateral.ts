import { FunctionReturn, FunctionOptions } from '@heyanon/sdk';
import { type Props, supplyInternal } from '../internal/supplyInternal';

export async function supplyCollateral(props: Props, functionOptions: FunctionOptions): Promise<FunctionReturn> {
    return supplyInternal(props, functionOptions);
}

import { Address } from 'viem';
import { FunctionReturn, FunctionOptions, toResult } from '@heyanon/sdk';
import { getBalances as getMagpieBalances } from '../utils';
import { GETTER_LIMIT } from '../constants';

interface Props {
    account: Address;
}

export async function getBalances({ account }: Props, helpers: FunctionOptions): Promise<FunctionReturn> {
    const { notify } = helpers;

    if (!account) {
        return toResult('Wallet is not connected', true);
    }

    const { result: tokensResult, balances } = await getMagpieBalances({ account }, helpers);

    if (tokensResult) {
        return tokensResult;
    }

    if (!balances) {
        return toResult('Balances were not found', true);
    }

    const limitedBalances = balances.slice(0, GETTER_LIMIT);

    await notify(`We show info for ${limitedBalances.length} balances...`);

    return toResult(JSON.stringify(limitedBalances));
}

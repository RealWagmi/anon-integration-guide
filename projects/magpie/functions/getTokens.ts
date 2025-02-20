import { Address } from 'viem';
import { FunctionReturn, FunctionOptions, toResult } from '@heyanon/sdk';
import { getTokens as getMagpieTokens } from '../utils';
import { GETTER_LIMIT } from '../constants';

interface Props {
    searchValue: Address[] | string;
}

export async function getTokens({ searchValue }: Props, helpers: FunctionOptions): Promise<FunctionReturn> {
    const { notify } = helpers;

    if (!searchValue) {
        return toResult('Search value is not specified', true);
    }

    const { result: tokensResult, tokens } = await getMagpieTokens({ searchValue }, helpers);

    if (tokensResult) {
        return tokensResult;
    }

    if (!tokens) {
        return toResult('Tokens were not found', true);
    }

    const limitedTokens = tokens.slice(0, GETTER_LIMIT);

    await notify(`We show info for ${limitedTokens.length} tokens...`);

    return toResult(JSON.stringify(limitedTokens));
}

import { afterEach, describe, it, vi } from 'vitest';
import { getLPPositionsFunction, Props } from '../functions/getLPPositions.js';
import { FunctionOptions } from '@heyanon/sdk';

describe('Get LP Positions', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    const props: Props = {
        chainName: 'sonic',
        account: '0x031F72dEB03C509af42624ddcD1f63fce5eCb220',
    };

    it('it should get lp positions from user', async () => {
        const result = await getLPPositionsFunction(props, {} as FunctionOptions);
        console.log(result.data);
    });
});

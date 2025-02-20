import { Hex } from 'viem';
import { describe, expect, it, vi } from 'vitest';
import { FEE_AMOUNTS, FEE_SIZE, FeeAmount } from '../constants';
import { getPath } from './getPath';

vi.mock('@heyanon/sdk');

describe('getPath', () => {
    it('should return path for specified tokens and fees', async () => {
        const tokens: Hex[] = ['0x4200000000000000000000000000000000000006', '0x940181a94a35a4569e4529a3cdfb74e38fd98631'];
        const fees: FeeAmount[] = ['V3_LOW'];

        const props: Parameters<typeof getPath>[0] = {
            account: '0x1234567890123456789012345678901234567890',
            chainName: 'Base',
            tokens,
            fees,
        };

        const tools: Parameters<typeof getPath>[1] = {
            sendTransactions: vi.fn(),
            notify: vi.fn(),
            getProvider: vi.fn(),
        };

        const response = await getPath(props, tools);

        const _path = `${tokens[0]}${FEE_AMOUNTS[fees[0]].toString(16).padStart(2 * FEE_SIZE, '0')}${tokens[1].slice(2)}`;
        expect(response).toMatch(
            `Path for tokens ${tokens} at fees ${fees}: ${_path}`
        );
    });
});

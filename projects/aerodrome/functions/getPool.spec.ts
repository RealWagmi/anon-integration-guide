import { describe, expect, it, vi } from 'vitest';
import { POOL_FACTORY_ADDRESS } from '../constants';
import { getPool } from './getPool';
import poolFactory from "../abis/poolFactory";

vi.mock('@heyanon/sdk');

describe('getPool', () => {
    it('should return pool for specified tokens', async () => {
        const props: Parameters<typeof getPool>[0] = {
            account: '0x1234567890123456789012345678901234567890',
            chainName: 'Base',
            token0: '0x4200000000000000000000000000000000000006',
            token1: '0x940181a94a35a4569e4529a3cdfb74e38fd98631',
            fee: 'V3_LOW',
        };

        const poolAddress = '0x1234567890123456789012345678901234567891';

        const provider = {
            readContract: vi.fn().mockResolvedValueOnce(poolAddress),
        };

        const tools: Parameters<typeof getPool>[1] = {
            sendTransactions: vi.fn(),
            notify: vi.fn(),
            getProvider: vi.fn().mockReturnValue(provider),
        };

        const result = await getPool(props, tools);

        expect(provider.readContract).toHaveBeenCalledWith(
            expect.objectContaining({
                abi: poolFactory,
                address: POOL_FACTORY_ADDRESS,
                functionName: 'getPool',
                args: [props.token0, props.token1, props.fee],
            }),
        );
        expect(result.data).toMatch(
            `Found liquidity pool for pair of tokens: ${props.token0}:${props.token1} at fee ${props.fee}: ${poolAddress}`
        );
    });
});

import { describe, expect, it, vi } from 'vitest';

import pool from "../abis/pool";
import { getTickSpacing } from "./getTickSpacing";

vi.mock('@heyanon/sdk');

describe('getTickSpacing', () => {
    it('should return tick spacing for specified pool', async () => {
        const props: Parameters<typeof getTickSpacing>[0] = {
            account: '0x1234567890123456789012345678901234567890',
            chainName: 'Base',
            poolAddress: '0x1234567890123456789012345678901234567891'
        };

        const tickSpacing = 1;

        const provider = {
            readContract: vi.fn().mockResolvedValueOnce(tickSpacing),
        };

        const tools: Parameters<typeof getTickSpacing>[1] = {
            sendTransactions: vi.fn(),
            notify: vi.fn(),
            getProvider: vi.fn().mockReturnValue(provider),
        };

        const result = await getTickSpacing(props, tools);

        expect(provider.readContract).toHaveBeenCalledWith(
            expect.objectContaining({
                abi: pool,
                address: props.poolAddress,
                functionName: 'getTickSpacing',
                args: [],
            }),
        );
        expect(result.data).toMatch(
            `Tick spacing for pool address ${props.poolAddress}: ${tickSpacing}`
        );
    });
});

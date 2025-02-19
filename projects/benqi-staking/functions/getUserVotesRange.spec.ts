import { describe, expect, it, vi } from 'vitest';
import gaugeController from '../abis/gaugeController';
import { GAUGE_CONTROLLER_PROXY_ADDRESS } from '../constants';
import { getUserVotesRange } from './getUserVotesRange';

vi.mock('@heyanon/sdk');

describe('getUserVotesRange', () => {
    it('should return no votes message', async () => {
        const props: Parameters<typeof getUserVotesRange>[0] = {
            account: '0x1234567890123456789012345678901234567890',
            chainName: 'Avalanche',
            from: 0,
            to: 2,
        };

        const provider = {
            readContract: vi.fn().mockReturnValue(Promise.resolve([[], []])),
        };
        const tools: Parameters<typeof getUserVotesRange>[1] = {
            sendTransactions: vi.fn(),
            notify: vi.fn(),
            getProvider: vi.fn().mockReturnValue(provider),
        };

        const result = await getUserVotesRange(props, tools);

        expect(provider.readContract).toHaveBeenCalledWith(
            expect.objectContaining({
                abi: gaugeController,
                address: GAUGE_CONTROLLER_PROXY_ADDRESS,
                functionName: 'getUserVotesRange',
                args: [0n, 2n],
            }),
        );
        expect(result.data).toEqual('User has not voted for any nodes');
    });

    it('should format response with node list', async () => {
        const props: Parameters<typeof getUserVotesRange>[0] = {
            account: '0x1234567890123456789012345678901234567890',
            chainName: 'Avalanche',
            from: 0,
            to: 2,
        };

        const provider = {
            readContract: vi.fn().mockReturnValue(
                Promise.resolve([
                    ['NodeID-1', 'NodeID-2'],
                    [2000n, 8000n],
                ]),
            ),
        };

        const tools: Parameters<typeof getUserVotesRange>[1] = {
            sendTransactions: vi.fn(),
            notify: vi.fn(),
            getProvider: vi.fn().mockReturnValue(provider),
        };

        const result = await getUserVotesRange(props, tools);

        expect(provider.readContract).toHaveBeenCalledWith(
            expect.objectContaining({
                abi: gaugeController,
                address: GAUGE_CONTROLLER_PROXY_ADDRESS,
                functionName: 'getUserVotesRange',
                args: [0n, 2n],
            }),
        );
        expect(result.data).toMatch(/NodeID-1 with weight of 20%/);
        expect(result.data).toMatch(/NodeID-2 with weight of 80%/);
    });
});

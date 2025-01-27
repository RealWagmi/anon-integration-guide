import { describe, expect, it, vi } from 'vitest';
import gaugeController from '../abis/gaugeController';
import { GAUGE_CONTROLLER_PROXY_ADDRESS } from '../constants';
import { getUserVotesLength } from './getUserVotesLength';

vi.mock('@heyanon/sdk');

describe('getUserVotesLength', () => {
    it('should format response in the singular form', async () => {
        const props: Parameters<typeof getUserVotesLength>[0] = {
            account: '0x0000000000000000000000000000000000000000',
            chainName: 'Avalanche',
        };

        const provider = {
            readContract: vi.fn().mockReturnValue(Promise.resolve(1n)),
        };

        const tools: Parameters<typeof getUserVotesLength>[1] = {
            sendTransactions: vi.fn(),
            notify: vi.fn(),
            getProvider: vi.fn().mockReturnValue(provider),
        };

        const result = await getUserVotesLength(props, tools);

        expect(provider.readContract).toHaveBeenCalledWith(
            expect.objectContaining({
                abi: gaugeController,
                address: GAUGE_CONTROLLER_PROXY_ADDRESS,
                functionName: 'getUserVotesLength',
                args: [],
            }),
        );
        expect(result.data).toEqual('User has 1 vote');
    });

    it('should format response in the plural form', async () => {
        const props: Parameters<typeof getUserVotesLength>[0] = {
            account: '0x0000000000000000000000000000000000000000',
            chainName: 'Avalanche',
        };

        const provider = {
            readContract: vi.fn().mockReturnValue(Promise.resolve(5n)),
        };

        const tools: Parameters<typeof getUserVotesLength>[1] = {
            sendTransactions: vi.fn(),
            notify: vi.fn(),
            getProvider: vi.fn().mockReturnValue(provider),
        };

        const result = await getUserVotesLength(props, tools);

        expect(provider.readContract).toHaveBeenCalledWith(
            expect.objectContaining({
                abi: gaugeController,
                address: GAUGE_CONTROLLER_PROXY_ADDRESS,
                functionName: 'getUserVotesLength',
                args: [],
            }),
        );
        expect(result.data).toEqual('User has 5 votes');
    });
});

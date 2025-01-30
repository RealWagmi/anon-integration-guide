import { describe, expect, it, vi } from 'vitest';
import igniteAbi from '../abis/ignite';
import { IGNITE_ADDRESS } from '../constants';
import { getRegistrationsByAccount } from './getRegistrationsByAccount';

vi.mock('@heyanon/sdk');

describe('getRegistrationsByAccount', () => {
    it('should return account registrations', async () => {
        const props: Parameters<typeof getRegistrationsByAccount>[0] = {
            account: '0x1234567890123456789012345678901234567890',
            chainName: 'Avalanche',
            from: 0,
            to: 10,
        };

        const response = [];

        const provider = {
            readContract: vi.fn().mockReturnValue(Promise.resolve(response)),
        };

        const tools: Parameters<typeof getRegistrationsByAccount>[1] = {
            sendTransactions: vi.fn(),
            notify: vi.fn(),
            getProvider: vi.fn().mockReturnValue(provider),
        };

        const result = await getRegistrationsByAccount(props, tools);

        expect(provider.readContract).toHaveBeenCalledWith(
            expect.objectContaining({
                address: IGNITE_ADDRESS,
                abi: igniteAbi,
                functionName: 'getRegistrationsByAccount',
                args: [props.account, BigInt(props.from), BigInt(props.to)],
            }),
        );
        expect(result.data).toMatch(`Registration made by ${props.account}:`);
    });
});

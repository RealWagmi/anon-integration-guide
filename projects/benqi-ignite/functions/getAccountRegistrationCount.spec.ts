import { describe, expect, it, vi } from 'vitest';
import igniteAbi from '../abis/ignite';
import { IGNITE_ADDRESS } from '../constants';
import { getAccountRegistrationCount } from './getAccountRegistrationCount';

vi.mock('@heyanon/sdk');

describe('getAccountRegistrationCount', () => {
    it('should return account registration count', async () => {
        const props: Parameters<typeof getAccountRegistrationCount>[0] = {
            account: '0x1234567890123456789012345678901234567890',
            chainName: 'Avalanche',
        };

        const response = 10n;

        const provider = {
            readContract: vi.fn().mockReturnValue(Promise.resolve(response)),
        };

        const tools: Parameters<typeof getAccountRegistrationCount>[1] = {
            sendTransactions: vi.fn(),
            notify: vi.fn(),
            getProvider: vi.fn().mockReturnValue(provider),
        };

        const result = await getAccountRegistrationCount(props, tools);

        expect(provider.readContract).toHaveBeenCalledWith(
            expect.objectContaining({
                address: IGNITE_ADDRESS,
                abi: igniteAbi,
                functionName: 'getAccountRegistrationCount',
                args: [props.account],
            }),
        );
        expect(result.data).toMatch(`Registration count: ${response}`);
    });
});

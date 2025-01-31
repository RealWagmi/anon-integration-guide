import { encodeFunctionData } from 'viem';
import { describe, expect, it, vi } from 'vitest';
import igniteAbi from '../abis/ignite';
import { IGNITE_ADDRESS } from '../constants';
import { redeemAfterExpiry } from './redeemAfterExpiry';

vi.mock('@heyanon/sdk');

describe('redeemAfterExpiry', () => {
    it('should redeem deposited tokens', async () => {
        const props: Parameters<typeof redeemAfterExpiry>[0] = {
            account: '0x1234567890123456789012345678901234567890',
            chainName: 'Avalanche',
            nodeId: 'NodeID-1',
        };

        const tools: Parameters<typeof redeemAfterExpiry>[1] = {
            sendTransactions: vi.fn().mockReturnValue(Promise.resolve({ data: ['Result'], isMultisig: false })),
            notify: vi.fn(),
            getProvider: vi.fn(),
        };

        const result = await redeemAfterExpiry(props, tools);

        expect(tools.sendTransactions).toHaveBeenCalledWith(
            expect.objectContaining({
                transactions: [
                    {
                        target: IGNITE_ADDRESS,
                        data: encodeFunctionData({
                            abi: igniteAbi,
                            functionName: 'redeemAfterExpiry',
                            args: [props.nodeId],
                        }),
                    },
                ],
            }),
        );
        expect(result.data).toMatch(`Successfully redeemed tokens for node ${props.nodeId}`);
    });
});

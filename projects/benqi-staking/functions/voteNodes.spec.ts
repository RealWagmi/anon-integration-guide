import { encodeFunctionData } from 'viem';
import { describe, expect, it, vi } from 'vitest';
import gaugeControllerAbi from '../abis/gaugeController';
import { GAUGE_CONTROLLER_PROXY_ADDRESS } from '../constants';
import { parseWeight } from '../utils';
import { voteNodes } from './voteNodes';

vi.mock('@heyanon/sdk');

describe('voteNodes', () => {
    it('should call voteNodes of gaugeController contract', async () => {
        const props: Parameters<typeof voteNodes>[0] = {
            account: '0x1234567890123456789012345678901234567890',
            chainName: 'Avalanche',
            nodeIds: ['NodeID-1'],
            weights: ['10'],
        };

        const tools: Parameters<typeof voteNodes>[1] = {
            sendTransactions: vi.fn().mockReturnValue(Promise.resolve({ data: ['Result'], isMultisig: false })),
            notify: vi.fn(),
            getProvider: vi.fn(),
        };

        const result = await voteNodes(props, tools);

        expect(tools.sendTransactions).toHaveBeenCalledWith(
            expect.objectContaining({
                transactions: [
                    {
                        target: GAUGE_CONTROLLER_PROXY_ADDRESS,
                        data: encodeFunctionData({
                            abi: gaugeControllerAbi,
                            functionName: 'voteNodes',
                            args: [props.nodeIds, props.weights.map(parseWeight)],
                        }),
                    },
                ],
            }),
        );
        expect(result.data).toMatch('Successfully updated votes');
    });
});

import { encodeFunctionData } from 'viem';
import { describe, expect, it, vi } from 'vitest';
import gaugeControllerAbi from '../abis/gaugeController';
import { GAUGE_CONTROLLER_PROXY_ADDRESS } from '../constants';
import { parseWeight } from '../utils';
import { unvoteNodes } from './unvoteNodes';

vi.mock('@heyanon/sdk');

describe('unvoteNodes', () => {
    it('should call requestUnlock of veQi contract', async () => {
        const props: Parameters<typeof unvoteNodes>[0] = {
            account: '0x0000000000000000000000000000000000000000',
            chainName: 'Avalanche',
            nodeIds: ['NodeID-1'],
            weights: ['10'],
        };

        const tools: Parameters<typeof unvoteNodes>[1] = {
            sendTransactions: vi.fn().mockReturnValue(Promise.resolve({ data: ['Result'], isMultisig: false })),
            notify: vi.fn(),
            getProvider: vi.fn(),
        };

        const result = await unvoteNodes(props, tools);

        expect(tools.sendTransactions).toHaveBeenCalledWith(
            expect.objectContaining({
                transactions: [
                    {
                        target: GAUGE_CONTROLLER_PROXY_ADDRESS,
                        data: encodeFunctionData({
                            abi: gaugeControllerAbi,
                            functionName: 'unvoteNodes',
                            args: [props.nodeIds, props.weights.map(parseWeight)],
                        }),
                    },
                ],
            }),
        );
        expect(result.data).toMatch('Successfully updated votes');
    });
});

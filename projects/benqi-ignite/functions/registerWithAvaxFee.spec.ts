import { encodeFunctionData } from 'viem';
import { describe, expect, it, vi } from 'vitest';
import igniteAbi from '../abis/ignite';
import { AVAX_REGISTRATION_FEE, IGNITE_ADDRESS, VALIDATION_DURATION_TIME } from '../constants';
import { registerWithAvaxFee } from './registerWithAvaxFee';

vi.mock('@heyanon/sdk');

const blsProofOfPossession =
    '0xb669f548233c42cceee50cff97a9a112a7e1759a6aa2b6af4a2d73fd79becd3999c86fd188dfa800436c79a1b86a3c77906522b03ddce477bfe913446da6b193314830935042100f814659b803b0678c70273ecdae63c94d94dee2c4ece175b4022e50640b514b301cbb82b31b152c1d2bf1db405b8ca94ca4f3ba6ec6c5da9d0cf45944637025373e983168384a6cee';

describe('registerWithAvaxFee', () => {
    it('should redeem deposited tokens', async () => {
        const props: Parameters<typeof registerWithAvaxFee>[0] = {
            account: '0x1234567890123456789012345678901234567890',
            chainName: 'Avalanche',
            nodeId: 'NodeID-1',
            blsProofOfPossession,
            validationDuration: 'TWO_WEEKS',
        };

        const tools: Parameters<typeof registerWithAvaxFee>[1] = {
            sendTransactions: vi.fn().mockReturnValue(Promise.resolve({ data: ['Result'], isMultisig: false })),
            notify: vi.fn(),
            getProvider: vi.fn(),
        };

        const result = await registerWithAvaxFee(props, tools);

        expect(tools.sendTransactions).toHaveBeenCalledWith(
            expect.objectContaining({
                transactions: [
                    {
                        target: IGNITE_ADDRESS,
                        data: encodeFunctionData({
                            abi: igniteAbi,
                            functionName: 'registerWithAvaxFee',
                            args: [props.nodeId, props.blsProofOfPossession, VALIDATION_DURATION_TIME.TWO_WEEKS],
                        }),
                        value: AVAX_REGISTRATION_FEE.TWO_WEEKS,
                    },
                ],
            }),
        );
        expect(result.data).toMatch(`Successfully registered node ${props.nodeId} with AVAX token`);
    });
});

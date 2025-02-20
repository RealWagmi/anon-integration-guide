import { Address, Hex, PublicClient } from 'viem';
import { multiCall3 } from '../../constants';

interface Call {
    target: Address;
    bytes: Hex;
}

export class MultiCall {
    provider: PublicClient;

    constructor(_provider: PublicClient) {
        this.provider = _provider;
    }

    async multicall(calls: Call[]) {
        const [, data] = (await this.provider.readContract({
            abi: [
                {
                    inputs: [
                        {
                            components: [
                                { internalType: 'address', name: 'target', type: 'address' },
                                { internalType: 'bytes', name: 'callData', type: 'bytes' },
                            ],
                            internalType: 'struct Multicall3.Call[]',
                            name: 'calls',
                            type: 'tuple[]',
                        },
                    ],
                    name: 'aggregate',
                    outputs: [
                        { internalType: 'uint256', name: 'blockNumber', type: 'uint256' },
                        { internalType: 'bytes[]', name: 'returnData', type: 'bytes[]' },
                    ],
                    stateMutability: 'payable',
                    type: 'function',
                },
            ],
            address: multiCall3,
            functionName: 'aggregate',
            args: [calls],
        })) as [bigint, Hex[]];

        return data;
    }
}

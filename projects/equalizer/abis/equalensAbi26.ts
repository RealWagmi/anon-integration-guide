export const equalensAbi26 = [
    {
        inputs: [{ internalType: 'address', name: '_v', type: 'address' }],
        stateMutability: 'nonpayable',
        type: 'constructor',
    },
    {
        inputs: [],
        name: 'V',
        outputs: [{ internalType: 'contract IV', name: '', type: 'address' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'uint256', name: '_mi', type: 'uint256' }],
        name: 'getPoolsVotedByNft',
        outputs: [
            { internalType: 'address[]', name: '', type: 'address[]' },
            { internalType: 'uint256[]', name: '', type: 'uint256[]' },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'uint256', name: '_id', type: 'uint256' }],
        name: 'getVotedPoolsLength',
        outputs: [{ internalType: 'uint256', name: '_pvl', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
] as const;

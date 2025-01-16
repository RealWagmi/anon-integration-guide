export const clFarmLensAbi = [
    {
        inputs: [
            { internalType: 'contract IFarmland', name: 'farm', type: 'address' },
            { internalType: 'address', name: 'user', type: 'address' },
            { internalType: 'address', name: 'guard', type: 'address' },
        ],
        name: 'getClset',
        outputs: [{ internalType: 'uint256[13]', name: 'ret', type: 'uint256[13]' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'address[3][]', name: '_id', type: 'address[3][]' }],
        name: 'getClsets',
        outputs: [{ internalType: 'uint256[13][]', name: '', type: 'uint256[13][]' }],
        stateMutability: 'view',
        type: 'function',
    },
] as const;

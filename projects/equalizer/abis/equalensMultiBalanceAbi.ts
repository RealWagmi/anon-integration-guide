export const equalensMultiBalanceAbi = [
    {
        inputs: [{ internalType: 'address', name: 'tg', type: 'address' }],
        stateMutability: 'nonpayable',
        type: 'constructor',
    },
    {
        inputs: [],
        name: 'DAO',
        outputs: [{ internalType: 'address', name: '', type: 'address' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'address', name: 't', type: 'address' },
            { internalType: 'address[]', name: 'h', type: 'address[]' },
        ],
        name: 'balanceOf',
        outputs: [
            { internalType: 'uint256[]', name: '', type: 'uint256[]' },
            { internalType: 'uint256', name: 'n', type: 'uint256' },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'address[]', name: 't', type: 'address[]' },
            { internalType: 'address[]', name: 'h', type: 'address[]' },
        ],
        name: 'balanceOf',
        outputs: [
            { internalType: 'uint256[][]', name: '', type: 'uint256[][]' },
            { internalType: 'uint256[]', name: 'n', type: 'uint256[]' },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'address[]', name: 't', type: 'address[]' },
            { internalType: 'address[]', name: 'h', type: 'address[]' },
        ],
        name: 'balancesOf',
        outputs: [
            {
                components: [
                    { internalType: 'address', name: 'token', type: 'address' },
                    { internalType: 'uint256[]', name: 'bals', type: 'uint256[]' },
                    { internalType: 'uint256', name: 'tota', type: 'uint256' },
                ],
                internalType: 'struct multiBalance.BA[]',
                name: '',
                type: 'tuple[]',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'coinusd',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'address', name: 'tokenAddress', type: 'address' },
            { internalType: 'uint256', name: 'tokens', type: 'uint256' },
        ],
        name: 'rescue',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [],
        name: 'tvlGuru',
        outputs: [{ internalType: 'address', name: '', type: 'address' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'address[]', name: 't', type: 'address[]' }],
        name: 'tvlOfCoinLPT',
        outputs: [
            { internalType: 'uint256[]', name: '', type: 'uint256[]' },
            { internalType: 'uint256', name: 'n', type: 'uint256' },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'address[]', name: 't', type: 'address[]' },
            { internalType: 'address[]', name: 'u', type: 'address[]' },
        ],
        name: 'tvlOfUsdLPT',
        outputs: [
            { internalType: 'uint256[]', name: '', type: 'uint256[]' },
            { internalType: 'uint256', name: 'n', type: 'uint256' },
        ],
        stateMutability: 'view',
        type: 'function',
    },
] as const;

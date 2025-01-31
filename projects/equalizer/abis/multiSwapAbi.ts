export const multiSwapAbi = [
    {
        inputs: [
            {
                internalType: 'address',
                name: 't',
                type: 'address',
            },
            {
                internalType: 'address[]',
                name: 'h',
                type: 'address[]',
            },
        ],
        name: 'balanceOf',
        outputs: [
            {
                internalType: 'uint256[]',
                name: '',
                type: 'uint256[]',
            },
            {
                internalType: 'uint256',
                name: 'n',
                type: 'uint256',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address[]',
                name: 't',
                type: 'address[]',
            },
            {
                internalType: 'address[]',
                name: 'h',
                type: 'address[]',
            },
        ],
        name: 'balanceOf',
        outputs: [
            {
                internalType: 'uint256[][]',
                name: '',
                type: 'uint256[][]',
            },
            {
                internalType: 'uint256[]',
                name: 'n',
                type: 'uint256[]',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address[]',
                name: 't',
                type: 'address[]',
            },
            {
                internalType: 'address[]',
                name: 'h',
                type: 'address[]',
            },
        ],
        name: 'balancesOf',
        outputs: [
            {
                components: [
                    {
                        internalType: 'address',
                        name: 'token',
                        type: 'address',
                    },
                    {
                        internalType: 'uint256[]',
                        name: 'bals',
                        type: 'uint256[]',
                    },
                    {
                        internalType: 'uint256',
                        name: 'tota',
                        type: 'uint256',
                    },
                ],
                internalType: 'struct Equalens_multiBalance.BA[]',
                name: '',
                type: 'tuple[]',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: 'user',
                type: 'address',
            },
            {
                internalType: 'address[]',
                name: 'tokens',
                type: 'address[]',
            },
            {
                internalType: 'address[]',
                name: 'routers',
                type: 'address[]',
            },
        ],
        name: 'getMultipleBalanceAndAllowancesOf',
        outputs: [
            {
                components: [
                    {
                        internalType: 'uint256[]',
                        name: '_uint256s_',
                        type: 'uint256[]',
                    },
                ],
                internalType: 'struct Equalens_multiBalance.Uint256List[]',
                name: '',
                type: 'tuple[]',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
] as const; 

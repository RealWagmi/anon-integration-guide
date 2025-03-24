export const equalensAbi25 = [
    {
        inputs: [
            {
                internalType: 'address',
                name: '_v',
                type: 'address',
            },
            {
                internalType: 'address',
                name: '_f',
                type: 'address',
            },
            {
                internalType: 'address',
                name: '_e',
                type: 'address',
            },
        ],
        stateMutability: 'nonpayable',
        type: 'constructor',
    },
    {
        inputs: [],
        name: 'E',
        outputs: [
            {
                internalType: 'address',
                name: '',
                type: 'address',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'F',
        outputs: [
            {
                internalType: 'contract IF',
                name: '',
                type: 'address',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'V',
        outputs: [
            {
                internalType: 'contract IV',
                name: '',
                type: 'address',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'VE',
        outputs: [
            {
                internalType: 'contract IVE',
                name: '',
                type: 'address',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: 'who',
                type: 'address',
            },
        ],
        name: 'infoGauge',
        outputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
            {
                components: [
                    {
                        internalType: 'address[4]',
                        name: 'A',
                        type: 'address[4]',
                    },
                    {
                        internalType: 'uint256[9]',
                        name: 'N',
                        type: 'uint256[9]',
                    },
                ],
                internalType: 'struct Equalens_pairInfo.G[]',
                name: '',
                type: 'tuple[]',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'address', name: 'who', type: 'address' },
            { internalType: 'uint256', name: 'si', type: 'uint256' },
            { internalType: 'uint256', name: 'fi', type: 'uint256' },
        ],
        name: 'infoGaugeN',
        outputs: [
            { internalType: 'uint256', name: '', type: 'uint256' },
            {
                components: [
                    { internalType: 'address[4]', name: 'A', type: 'address[4]' },
                    { internalType: 'uint256[9]', name: 'N', type: 'uint256[9]' },
                ],
                internalType: 'struct Equalens_pairInfo.G[]',
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
                name: 'who',
                type: 'address',
            },
        ],
        name: 'infoPair',
        outputs: [
            {
                components: [
                    {
                        internalType: 'address[5]',
                        name: 'A',
                        type: 'address[5]',
                    },
                    {
                        internalType: 'uint256[8]',
                        name: 'N',
                        type: 'uint256[8]',
                    },
                ],
                internalType: 'struct Equalens_pairInfo.P[]',
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
                name: 'who',
                type: 'address',
            },
            {
                internalType: 'uint256',
                name: 'si',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'fi',
                type: 'uint256',
            },
        ],
        name: 'infoPairN',
        outputs: [
            {
                components: [
                    {
                        internalType: 'address[5]',
                        name: 'A',
                        type: 'address[5]',
                    },
                    {
                        internalType: 'uint256[8]',
                        name: 'N',
                        type: 'uint256[8]',
                    },
                ],
                internalType: 'struct Equalens_pairInfo.P[]',
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
                name: 'who',
                type: 'address',
            },
        ],
        name: 'infoPool',
        outputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
            {
                components: [
                    {
                        internalType: 'address[5]',
                        name: 'A',
                        type: 'address[5]',
                    },
                    {
                        internalType: 'uint256[17]',
                        name: 'N',
                        type: 'uint256[17]',
                    },
                ],
                internalType: 'struct Equalens_pairInfo.PL[]',
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
                name: 'who',
                type: 'address',
            },
            {
                internalType: 'uint256',
                name: 'si',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'fi',
                type: 'uint256',
            },
        ],
        name: 'infoPoolN',
        outputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
            {
                components: [
                    {
                        internalType: 'address[5]',
                        name: 'A',
                        type: 'address[5]',
                    },
                    {
                        internalType: 'uint256[17]',
                        name: 'N',
                        type: 'uint256[17]',
                    },
                ],
                internalType: 'struct Equalens_pairInfo.PL[]',
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
                name: 'who',
                type: 'address',
            },
            {
                internalType: 'uint256[]',
                name: 'pinds',
                type: 'uint256[]',
            },
        ],
        name: 'infoPoolNN',
        outputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
            {
                components: [
                    {
                        internalType: 'address[5]',
                        name: 'A',
                        type: 'address[5]',
                    },
                    {
                        internalType: 'uint256[17]',
                        name: 'N',
                        type: 'uint256[17]',
                    },
                ],
                internalType: 'struct Equalens_pairInfo.PL[]',
                name: '',
                type: 'tuple[]',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'owner',
        outputs: [
            {
                internalType: 'address',
                name: '',
                type: 'address',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: '_v',
                type: 'address',
            },
            {
                internalType: 'address',
                name: '_f',
                type: 'address',
            },
            {
                internalType: 'address',
                name: '_e',
                type: 'address',
            },
        ],
        name: 'setVFE',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
] as const;

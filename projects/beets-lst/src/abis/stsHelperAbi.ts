export const stsHelperAbi = [
    {
        inputs: [
            {
                internalType: 'address payable',
                name: '_sonicStaking',
                type: 'address',
            },
        ],
        stateMutability: 'nonpayable',
        type: 'constructor',
    },
    {
        inputs: [],
        name: 'UserWithdrawsMaxSizeCannotBeZero',
        type: 'error',
    },
    {
        inputs: [],
        name: 'UserWithdrawsSkipTooLarge',
        type: 'error',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: 'user',
                type: 'address',
            },
            {
                internalType: 'uint256',
                name: 'skip',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'maxSize',
                type: 'uint256',
            },
            {
                internalType: 'bool',
                name: 'reverseOrder',
                type: 'bool',
            },
        ],
        name: 'getUserWithdraws',
        outputs: [
            {
                components: [
                    {
                        internalType: 'uint256',
                        name: 'id',
                        type: 'uint256',
                    },
                    {
                        internalType: 'enum SonicStaking.WithdrawKind',
                        name: 'kind',
                        type: 'uint8',
                    },
                    {
                        internalType: 'uint256',
                        name: 'validatorId',
                        type: 'uint256',
                    },
                    {
                        internalType: 'uint256',
                        name: 'assetAmount',
                        type: 'uint256',
                    },
                    {
                        internalType: 'bool',
                        name: 'isWithdrawn',
                        type: 'bool',
                    },
                    {
                        internalType: 'uint256',
                        name: 'requestTimestamp',
                        type: 'uint256',
                    },
                    {
                        internalType: 'address',
                        name: 'user',
                        type: 'address',
                    },
                ],
                internalType: 'struct SonicStakingWithdrawRequestHelper.WithdrawRequest[]',
                name: 'withdraws',
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
        ],
        name: 'getUserWithdrawsCount',
        outputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: 'withdrawId',
                type: 'uint256',
            },
        ],
        name: 'getWithdrawRequest',
        outputs: [
            {
                components: [
                    {
                        internalType: 'uint256',
                        name: 'id',
                        type: 'uint256',
                    },
                    {
                        internalType: 'enum SonicStaking.WithdrawKind',
                        name: 'kind',
                        type: 'uint8',
                    },
                    {
                        internalType: 'uint256',
                        name: 'validatorId',
                        type: 'uint256',
                    },
                    {
                        internalType: 'uint256',
                        name: 'assetAmount',
                        type: 'uint256',
                    },
                    {
                        internalType: 'bool',
                        name: 'isWithdrawn',
                        type: 'bool',
                    },
                    {
                        internalType: 'uint256',
                        name: 'requestTimestamp',
                        type: 'uint256',
                    },
                    {
                        internalType: 'address',
                        name: 'user',
                        type: 'address',
                    },
                ],
                internalType: 'struct SonicStakingWithdrawRequestHelper.WithdrawRequest',
                name: '',
                type: 'tuple',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'sonicStaking',
        outputs: [
            {
                internalType: 'contract SonicStaking',
                name: '',
                type: 'address',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
] as const;

export const routerAbi = [
    {
        inputs: [
            {
                internalType: 'address',
                name: '_wrappedNativeToken',
                type: 'address',
            },
        ],
        stateMutability: 'nonpayable',
        type: 'constructor',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: 'target',
                type: 'address',
            },
        ],
        name: 'AddressEmptyCode',
        type: 'error',
    },
    {
        inputs: [],
        name: 'ApprovalFailed',
        type: 'error',
    },
    {
        inputs: [],
        name: 'ERC20TransferFailed',
        type: 'error',
    },
    {
        inputs: [],
        name: 'EthTransferFailed',
        type: 'error',
    },
    {
        inputs: [],
        name: 'FailedCall',
        type: 'error',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: 'balance',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'needed',
                type: 'uint256',
            },
        ],
        name: 'InsufficientBalance',
        type: 'error',
    },
    {
        inputs: [],
        name: 'InvalidSilo',
        type: 'error',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: 'token',
                type: 'address',
            },
        ],
        name: 'SafeERC20FailedOperation',
        type: 'error',
    },
    {
        inputs: [],
        name: 'TokenIsNotAContract',
        type: 'error',
    },
    {
        inputs: [],
        name: 'WRAPPED_NATIVE_TOKEN',
        outputs: [
            {
                internalType: 'contract IWrappedNativeToken',
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
                components: [
                    {
                        internalType: 'enum SiloRouter.ActionType',
                        name: 'actionType',
                        type: 'uint8',
                    },
                    {
                        internalType: 'contract ISilo',
                        name: 'silo',
                        type: 'address',
                    },
                    {
                        internalType: 'contract IERC20',
                        name: 'asset',
                        type: 'address',
                    },
                    {
                        internalType: 'bytes',
                        name: 'options',
                        type: 'bytes',
                    },
                ],
                internalType: 'struct SiloRouter.Action[]',
                name: '_actions',
                type: 'tuple[]',
            },
        ],
        name: 'execute',
        outputs: [],
        stateMutability: 'payable',
        type: 'function',
    },
    {
        stateMutability: 'payable',
        type: 'receive',
    },
];

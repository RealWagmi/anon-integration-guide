export const stakerGatewayAbi = [
    { inputs: [], stateMutability: 'nonpayable', type: 'constructor' },
    { inputs: [{ internalType: 'address', name: 'target', type: 'address' }], name: 'AddressEmptyCode', type: 'error' },
    { inputs: [{ internalType: 'address', name: 'account', type: 'address' }], name: 'AddressInsufficientBalance', type: 'error' },
    { inputs: [], name: 'CannotReceiveNativeTokens', type: 'error' },
    { inputs: [{ internalType: 'address', name: 'implementation', type: 'address' }], name: 'ERC1967InvalidImplementation', type: 'error' },
    { inputs: [], name: 'ERC1967NonPayable', type: 'error' },
    { inputs: [], name: 'FailedInnerCall', type: 'error' },
    { inputs: [{ internalType: 'string', name: '', type: 'string' }], name: 'InvalidArgument', type: 'error' },
    { inputs: [], name: 'InvalidInitialization', type: 'error' },
    { inputs: [], name: 'InvalidZeroAddress', type: 'error' },
    { inputs: [], name: 'NotInitializing', type: 'error' },
    { inputs: [], name: 'ReentrancyGuardReentrantCall', type: 'error' },
    { inputs: [{ internalType: 'address', name: 'token', type: 'address' }], name: 'SafeERC20FailedOperation', type: 'error' },
    { inputs: [], name: 'UUPSUnauthorizedCallContext', type: 'error' },
    { inputs: [{ internalType: 'bytes32', name: 'slot', type: 'bytes32' }], name: 'UUPSUnsupportedProxiableUUID', type: 'error' },
    { inputs: [{ internalType: 'string', name: '', type: 'string' }], name: 'UnstakeFailed', type: 'error' },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: 'address', name: 'staker', type: 'address' },
            { indexed: true, internalType: 'address', name: 'asset', type: 'address' },
            { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
            { indexed: true, internalType: 'string', name: 'referralId', type: 'string' },
        ],
        name: 'AssetStaked',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: 'address', name: 'staker', type: 'address' },
            { indexed: true, internalType: 'address', name: 'asset', type: 'address' },
            { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
            { indexed: true, internalType: 'string', name: 'referralId', type: 'string' },
        ],
        name: 'AssetUnstaked',
        type: 'event',
    },
    { anonymous: false, inputs: [{ indexed: false, internalType: 'uint64', name: 'version', type: 'uint64' }], name: 'Initialized', type: 'event' },
    { anonymous: false, inputs: [{ indexed: true, internalType: 'address', name: 'implementation', type: 'address' }], name: 'Upgraded', type: 'event' },
    { inputs: [], name: 'UPGRADE_INTERFACE_VERSION', outputs: [{ internalType: 'string', name: '', type: 'string' }], stateMutability: 'view', type: 'function' },
    {
        inputs: [
            { internalType: 'address', name: 'asset', type: 'address' },
            { internalType: 'address', name: 'owner', type: 'address' },
        ],
        name: 'balanceOf',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    { inputs: [], name: 'getConfig', outputs: [{ internalType: 'address', name: '', type: 'address' }], stateMutability: 'view', type: 'function' },
    {
        inputs: [{ internalType: 'address', name: 'asset', type: 'address' }],
        name: 'getVault',
        outputs: [{ internalType: 'address', name: '', type: 'address' }],
        stateMutability: 'view',
        type: 'function',
    },
    { inputs: [{ internalType: 'address', name: 'configAddr', type: 'address' }], name: 'initialize', outputs: [], stateMutability: 'nonpayable', type: 'function' },
    { inputs: [], name: 'proxiableUUID', outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }], stateMutability: 'view', type: 'function' },
    {
        inputs: [
            { internalType: 'address', name: 'asset', type: 'address' },
            { internalType: 'uint256', name: 'amount', type: 'uint256' },
            { internalType: 'string', name: 'referralId', type: 'string' },
        ],
        name: 'stake',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    { inputs: [{ internalType: 'string', name: 'referralId', type: 'string' }], name: 'stakeClisBNB', outputs: [], stateMutability: 'payable', type: 'function' },
    { inputs: [{ internalType: 'string', name: 'referralId', type: 'string' }], name: 'stakeNative', outputs: [], stateMutability: 'payable', type: 'function' },
    {
        inputs: [
            { internalType: 'address', name: 'asset', type: 'address' },
            { internalType: 'uint256', name: 'amount', type: 'uint256' },
            { internalType: 'string', name: 'referralId', type: 'string' },
        ],
        name: 'unstake',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'uint256', name: 'amount', type: 'uint256' },
            { internalType: 'string', name: 'referralId', type: 'string' },
        ],
        name: 'unstakeClisBNB',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'uint256', name: 'amount', type: 'uint256' },
            { internalType: 'string', name: 'referralId', type: 'string' },
        ],
        name: 'unstakeNative',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'address', name: 'newImplementation', type: 'address' },
            { internalType: 'bytes', name: 'data', type: 'bytes' },
        ],
        name: 'upgradeToAndCall',
        outputs: [],
        stateMutability: 'payable',
        type: 'function',
    },
    { inputs: [], name: 'version', outputs: [{ internalType: 'string', name: '', type: 'string' }], stateMutability: 'pure', type: 'function' },
    { stateMutability: 'payable', type: 'receive' },
];

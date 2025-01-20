export const stkscUsdWithdrawQueueAbi = [
    {
        inputs: [
            { internalType: 'address', name: '_owner', type: 'address' },
            { internalType: 'address', name: '_auth', type: 'address' },
            { internalType: 'address payable', name: '_boringVault', type: 'address' },
            { internalType: 'address', name: '_accountant', type: 'address' },
        ],
        stateMutability: 'nonpayable',
        type: 'constructor',
    },
    { inputs: [], name: 'BoringOnChainQueue__BadDeadline', type: 'error' },
    { inputs: [], name: 'BoringOnChainQueue__BadDiscount', type: 'error' },
    { inputs: [], name: 'BoringOnChainQueue__BadInput', type: 'error' },
    { inputs: [], name: 'BoringOnChainQueue__BadShareAmount', type: 'error' },
    { inputs: [], name: 'BoringOnChainQueue__BadUser', type: 'error' },
    { inputs: [], name: 'BoringOnChainQueue__DeadlinePassed', type: 'error' },
    { inputs: [], name: 'BoringOnChainQueue__Keccak256Collision', type: 'error' },
    { inputs: [], name: 'BoringOnChainQueue__MAXIMUM_MINIMUM_SECONDS_TO_DEADLINE', type: 'error' },
    { inputs: [], name: 'BoringOnChainQueue__MAXIMUM_SECONDS_TO_MATURITY', type: 'error' },
    { inputs: [], name: 'BoringOnChainQueue__MAX_DISCOUNT', type: 'error' },
    { inputs: [], name: 'BoringOnChainQueue__NotMatured', type: 'error' },
    { inputs: [], name: 'BoringOnChainQueue__Overflow', type: 'error' },
    { inputs: [], name: 'BoringOnChainQueue__Paused', type: 'error' },
    { inputs: [], name: 'BoringOnChainQueue__PermitFailedAndAllowanceTooLow', type: 'error' },
    { inputs: [], name: 'BoringOnChainQueue__RequestNotFound', type: 'error' },
    { inputs: [], name: 'BoringOnChainQueue__RescueCannotTakeSharesFromActiveRequests', type: 'error' },
    { inputs: [], name: 'BoringOnChainQueue__SolveAssetMismatch', type: 'error' },
    { inputs: [], name: 'BoringOnChainQueue__WithdrawsNotAllowedForAsset', type: 'error' },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: 'address', name: 'user', type: 'address' },
            { indexed: true, internalType: 'contract Authority', name: 'newAuthority', type: 'address' },
        ],
        name: 'AuthorityUpdated',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: 'bytes32', name: 'requestId', type: 'bytes32' },
            { indexed: true, internalType: 'address', name: 'user', type: 'address' },
            { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' },
        ],
        name: 'OnChainWithdrawCancelled',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: 'bytes32', name: 'requestId', type: 'bytes32' },
            { indexed: true, internalType: 'address', name: 'user', type: 'address' },
            { indexed: true, internalType: 'address', name: 'assetOut', type: 'address' },
            { indexed: false, internalType: 'uint96', name: 'nonce', type: 'uint96' },
            { indexed: false, internalType: 'uint128', name: 'amountOfShares', type: 'uint128' },
            { indexed: false, internalType: 'uint128', name: 'amountOfAssets', type: 'uint128' },
            { indexed: false, internalType: 'uint40', name: 'creationTime', type: 'uint40' },
            { indexed: false, internalType: 'uint24', name: 'secondsToMaturity', type: 'uint24' },
            { indexed: false, internalType: 'uint24', name: 'secondsToDeadline', type: 'uint24' },
        ],
        name: 'OnChainWithdrawRequested',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: 'bytes32', name: 'requestId', type: 'bytes32' },
            { indexed: true, internalType: 'address', name: 'user', type: 'address' },
            { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' },
        ],
        name: 'OnChainWithdrawSolved',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: 'address', name: 'user', type: 'address' },
            { indexed: true, internalType: 'address', name: 'newOwner', type: 'address' },
        ],
        name: 'OwnershipTransferred',
        type: 'event',
    },
    { anonymous: false, inputs: [], name: 'Paused', type: 'event' },
    { anonymous: false, inputs: [], name: 'Unpaused', type: 'event' },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: 'address', name: 'assetOut', type: 'address' },
            { indexed: false, internalType: 'uint24', name: 'secondsToMaturity', type: 'uint24' },
            { indexed: false, internalType: 'uint24', name: 'minimumSecondsToDeadline', type: 'uint24' },
            { indexed: false, internalType: 'uint16', name: 'minDiscount', type: 'uint16' },
            { indexed: false, internalType: 'uint16', name: 'maxDiscount', type: 'uint16' },
            { indexed: false, internalType: 'uint96', name: 'minimumShares', type: 'uint96' },
        ],
        name: 'WithdrawAssetSetup',
        type: 'event',
    },
    { anonymous: false, inputs: [{ indexed: true, internalType: 'address', name: 'assetOut', type: 'address' }], name: 'WithdrawAssetStopped', type: 'event' },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: 'address', name: 'assetOut', type: 'address' },
            { indexed: false, internalType: 'uint24', name: 'minimumSecondsToDeadline', type: 'uint24' },
            { indexed: false, internalType: 'uint24', name: 'secondsToMaturity', type: 'uint24' },
            { indexed: false, internalType: 'uint16', name: 'minDiscount', type: 'uint16' },
            { indexed: false, internalType: 'uint16', name: 'maxDiscount', type: 'uint16' },
            { indexed: false, internalType: 'uint96', name: 'minimumShares', type: 'uint96' },
        ],
        name: 'WithdrawAssetUpdated',
        type: 'event',
    },
    { inputs: [], name: 'ONE_SHARE', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
    { inputs: [], name: 'accountant', outputs: [{ internalType: 'contract AccountantWithRateProviders', name: '', type: 'address' }], stateMutability: 'view', type: 'function' },
    { inputs: [], name: 'authority', outputs: [{ internalType: 'contract Authority', name: '', type: 'address' }], stateMutability: 'view', type: 'function' },
    { inputs: [], name: 'boringVault', outputs: [{ internalType: 'contract BoringVault', name: '', type: 'address' }], stateMutability: 'view', type: 'function' },
    {
        inputs: [
            {
                components: [
                    { internalType: 'uint96', name: 'nonce', type: 'uint96' },
                    { internalType: 'address', name: 'user', type: 'address' },
                    { internalType: 'address', name: 'assetOut', type: 'address' },
                    { internalType: 'uint128', name: 'amountOfShares', type: 'uint128' },
                    { internalType: 'uint128', name: 'amountOfAssets', type: 'uint128' },
                    { internalType: 'uint40', name: 'creationTime', type: 'uint40' },
                    { internalType: 'uint24', name: 'secondsToMaturity', type: 'uint24' },
                    { internalType: 'uint24', name: 'secondsToDeadline', type: 'uint24' },
                ],
                internalType: 'struct BoringOnChainQueue.OnChainWithdraw',
                name: 'request',
                type: 'tuple',
            },
        ],
        name: 'cancelOnChainWithdraw',
        outputs: [{ internalType: 'bytes32', name: 'requestId', type: 'bytes32' }],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                components: [
                    { internalType: 'uint96', name: 'nonce', type: 'uint96' },
                    { internalType: 'address', name: 'user', type: 'address' },
                    { internalType: 'address', name: 'assetOut', type: 'address' },
                    { internalType: 'uint128', name: 'amountOfShares', type: 'uint128' },
                    { internalType: 'uint128', name: 'amountOfAssets', type: 'uint128' },
                    { internalType: 'uint40', name: 'creationTime', type: 'uint40' },
                    { internalType: 'uint24', name: 'secondsToMaturity', type: 'uint24' },
                    { internalType: 'uint24', name: 'secondsToDeadline', type: 'uint24' },
                ],
                internalType: 'struct BoringOnChainQueue.OnChainWithdraw[]',
                name: 'requests',
                type: 'tuple[]',
            },
        ],
        name: 'cancelUserWithdraws',
        outputs: [{ internalType: 'bytes32[]', name: 'canceledRequestIds', type: 'bytes32[]' }],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                components: [
                    { internalType: 'uint96', name: 'nonce', type: 'uint96' },
                    { internalType: 'address', name: 'user', type: 'address' },
                    { internalType: 'address', name: 'assetOut', type: 'address' },
                    { internalType: 'uint128', name: 'amountOfShares', type: 'uint128' },
                    { internalType: 'uint128', name: 'amountOfAssets', type: 'uint128' },
                    { internalType: 'uint40', name: 'creationTime', type: 'uint40' },
                    { internalType: 'uint24', name: 'secondsToMaturity', type: 'uint24' },
                    { internalType: 'uint24', name: 'secondsToDeadline', type: 'uint24' },
                ],
                internalType: 'struct BoringOnChainQueue.OnChainWithdraw',
                name: 'request',
                type: 'tuple',
            },
        ],
        name: 'getRequestId',
        outputs: [{ internalType: 'bytes32', name: 'requestId', type: 'bytes32' }],
        stateMutability: 'pure',
        type: 'function',
    },
    { inputs: [], name: 'getRequestIds', outputs: [{ internalType: 'bytes32[]', name: '', type: 'bytes32[]' }], stateMutability: 'view', type: 'function' },
    { inputs: [], name: 'isPaused', outputs: [{ internalType: 'bool', name: '', type: 'bool' }], stateMutability: 'view', type: 'function' },
    { inputs: [], name: 'nonce', outputs: [{ internalType: 'uint96', name: '', type: 'uint96' }], stateMutability: 'view', type: 'function' },
    { inputs: [], name: 'owner', outputs: [{ internalType: 'address', name: '', type: 'address' }], stateMutability: 'view', type: 'function' },
    { inputs: [], name: 'pause', outputs: [], stateMutability: 'nonpayable', type: 'function' },
    {
        inputs: [
            { internalType: 'address', name: 'assetOut', type: 'address' },
            { internalType: 'uint128', name: 'amountOfShares', type: 'uint128' },
            { internalType: 'uint16', name: 'discount', type: 'uint16' },
        ],
        name: 'previewAssetsOut',
        outputs: [{ internalType: 'uint128', name: 'amountOfAssets128', type: 'uint128' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                components: [
                    { internalType: 'uint96', name: 'nonce', type: 'uint96' },
                    { internalType: 'address', name: 'user', type: 'address' },
                    { internalType: 'address', name: 'assetOut', type: 'address' },
                    { internalType: 'uint128', name: 'amountOfShares', type: 'uint128' },
                    { internalType: 'uint128', name: 'amountOfAssets', type: 'uint128' },
                    { internalType: 'uint40', name: 'creationTime', type: 'uint40' },
                    { internalType: 'uint24', name: 'secondsToMaturity', type: 'uint24' },
                    { internalType: 'uint24', name: 'secondsToDeadline', type: 'uint24' },
                ],
                internalType: 'struct BoringOnChainQueue.OnChainWithdraw',
                name: 'oldRequest',
                type: 'tuple',
            },
            { internalType: 'uint16', name: 'discount', type: 'uint16' },
            { internalType: 'uint24', name: 'secondsToDeadline', type: 'uint24' },
        ],
        name: 'replaceOnChainWithdraw',
        outputs: [
            { internalType: 'bytes32', name: 'oldRequestId', type: 'bytes32' },
            { internalType: 'bytes32', name: 'newRequestId', type: 'bytes32' },
        ],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'address', name: 'assetOut', type: 'address' },
            { internalType: 'uint128', name: 'amountOfShares', type: 'uint128' },
            { internalType: 'uint16', name: 'discount', type: 'uint16' },
            { internalType: 'uint24', name: 'secondsToDeadline', type: 'uint24' },
        ],
        name: 'requestOnChainWithdraw',
        outputs: [{ internalType: 'bytes32', name: 'requestId', type: 'bytes32' }],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'address', name: 'assetOut', type: 'address' },
            { internalType: 'uint128', name: 'amountOfShares', type: 'uint128' },
            { internalType: 'uint16', name: 'discount', type: 'uint16' },
            { internalType: 'uint24', name: 'secondsToDeadline', type: 'uint24' },
            { internalType: 'uint256', name: 'permitDeadline', type: 'uint256' },
            { internalType: 'uint8', name: 'v', type: 'uint8' },
            { internalType: 'bytes32', name: 'r', type: 'bytes32' },
            { internalType: 'bytes32', name: 's', type: 'bytes32' },
        ],
        name: 'requestOnChainWithdrawWithPermit',
        outputs: [{ internalType: 'bytes32', name: 'requestId', type: 'bytes32' }],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'contract ERC20', name: 'token', type: 'address' },
            { internalType: 'uint256', name: 'amount', type: 'uint256' },
            { internalType: 'address', name: 'to', type: 'address' },
            {
                components: [
                    { internalType: 'uint96', name: 'nonce', type: 'uint96' },
                    { internalType: 'address', name: 'user', type: 'address' },
                    { internalType: 'address', name: 'assetOut', type: 'address' },
                    { internalType: 'uint128', name: 'amountOfShares', type: 'uint128' },
                    { internalType: 'uint128', name: 'amountOfAssets', type: 'uint128' },
                    { internalType: 'uint40', name: 'creationTime', type: 'uint40' },
                    { internalType: 'uint24', name: 'secondsToMaturity', type: 'uint24' },
                    { internalType: 'uint24', name: 'secondsToDeadline', type: 'uint24' },
                ],
                internalType: 'struct BoringOnChainQueue.OnChainWithdraw[]',
                name: 'activeRequests',
                type: 'tuple[]',
            },
        ],
        name: 'rescueTokens',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    { inputs: [{ internalType: 'contract Authority', name: 'newAuthority', type: 'address' }], name: 'setAuthority', outputs: [], stateMutability: 'nonpayable', type: 'function' },
    {
        inputs: [
            {
                components: [
                    { internalType: 'uint96', name: 'nonce', type: 'uint96' },
                    { internalType: 'address', name: 'user', type: 'address' },
                    { internalType: 'address', name: 'assetOut', type: 'address' },
                    { internalType: 'uint128', name: 'amountOfShares', type: 'uint128' },
                    { internalType: 'uint128', name: 'amountOfAssets', type: 'uint128' },
                    { internalType: 'uint40', name: 'creationTime', type: 'uint40' },
                    { internalType: 'uint24', name: 'secondsToMaturity', type: 'uint24' },
                    { internalType: 'uint24', name: 'secondsToDeadline', type: 'uint24' },
                ],
                internalType: 'struct BoringOnChainQueue.OnChainWithdraw[]',
                name: 'requests',
                type: 'tuple[]',
            },
            { internalType: 'bytes', name: 'solveData', type: 'bytes' },
            { internalType: 'address', name: 'solver', type: 'address' },
        ],
        name: 'solveOnChainWithdraws',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    { inputs: [{ internalType: 'address', name: 'assetOut', type: 'address' }], name: 'stopWithdrawsInAsset', outputs: [], stateMutability: 'nonpayable', type: 'function' },
    { inputs: [{ internalType: 'address', name: 'newOwner', type: 'address' }], name: 'transferOwnership', outputs: [], stateMutability: 'nonpayable', type: 'function' },
    { inputs: [], name: 'unpause', outputs: [], stateMutability: 'nonpayable', type: 'function' },
    {
        inputs: [
            { internalType: 'address', name: 'assetOut', type: 'address' },
            { internalType: 'uint24', name: 'secondsToMaturity', type: 'uint24' },
            { internalType: 'uint24', name: 'minimumSecondsToDeadline', type: 'uint24' },
            { internalType: 'uint16', name: 'minDiscount', type: 'uint16' },
            { internalType: 'uint16', name: 'maxDiscount', type: 'uint16' },
            { internalType: 'uint96', name: 'minimumShares', type: 'uint96' },
        ],
        name: 'updateWithdrawAsset',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'address', name: '', type: 'address' }],
        name: 'withdrawAssets',
        outputs: [
            { internalType: 'bool', name: 'allowWithdraws', type: 'bool' },
            { internalType: 'uint24', name: 'secondsToMaturity', type: 'uint24' },
            { internalType: 'uint24', name: 'minimumSecondsToDeadline', type: 'uint24' },
            { internalType: 'uint16', name: 'minDiscount', type: 'uint16' },
            { internalType: 'uint16', name: 'maxDiscount', type: 'uint16' },
            { internalType: 'uint96', name: 'minimumShares', type: 'uint96' },
        ],
        stateMutability: 'view',
        type: 'function',
    },
];

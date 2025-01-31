export default [
    {
        inputs: [],
        stateMutability: 'nonpayable',
        type: 'constructor',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: 'uint256',
                name: 'oldMinimumAvaxDeposit',
                type: 'uint256',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'newMinimumAvaxDeposit',
                type: 'uint256',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'oldMaximumAvaxDeposit',
                type: 'uint256',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'newMaximumAvaxDeposit',
                type: 'uint256',
            },
        ],
        name: 'AvaxDepositRangeUpdated',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: 'uint256',
                name: 'oldPercentage',
                type: 'uint256',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'newPercentage',
                type: 'uint256',
            },
        ],
        name: 'AvaxSlashPercentageChanged',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: 'uint8',
                name: 'version',
                type: 'uint8',
            },
        ],
        name: 'Initialized',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: 'uint256',
                name: 'oldMaximumSubsidisationAmount',
                type: 'uint256',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'newMaximumSubsidisationAmount',
                type: 'uint256',
            },
        ],
        name: 'MaximumSubsidisationAmountChanged',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: 'address',
                name: 'registerer',
                type: 'address',
            },
            {
                indexed: false,
                internalType: 'string',
                name: 'nodeId',
                type: 'string',
            },
            {
                indexed: false,
                internalType: 'bytes',
                name: 'blsProofOfPossession',
                type: 'bytes',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'validationDuration',
                type: 'uint256',
            },
            {
                indexed: false,
                internalType: 'bool',
                name: 'feePaid',
                type: 'bool',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'avaxAmount',
                type: 'uint256',
            },
            {
                indexed: false,
                internalType: 'address',
                name: 'token',
                type: 'address',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'tokenAmount',
                type: 'uint256',
            },
        ],
        name: 'NewRegistration',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: 'address',
                name: 'account',
                type: 'address',
            },
        ],
        name: 'Paused',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: 'address',
                name: 'token',
                type: 'address',
            },
        ],
        name: 'PaymentTokenAdded',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: 'address',
                name: 'token',
                type: 'address',
            },
        ],
        name: 'PaymentTokenRemoved',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: 'address',
                name: 'token',
                type: 'address',
            },
            {
                indexed: false,
                internalType: 'address',
                name: 'oldFeed',
                type: 'address',
            },
            {
                indexed: false,
                internalType: 'address',
                name: 'newFeed',
                type: 'address',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'oldMaxPriceAge',
                type: 'uint256',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'newMaxPriceAge',
                type: 'uint256',
            },
        ],
        name: 'PriceFeedChanged',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: 'uint256',
                name: 'oldQiPriceMultiplier',
                type: 'uint256',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'newQiPriceMultiplier',
                type: 'uint256',
            },
        ],
        name: 'QiPriceMultiplierUpdated',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: 'uint256',
                name: 'oldPercentage',
                type: 'uint256',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'newPercentage',
                type: 'uint256',
            },
        ],
        name: 'QiSlashPercentageChanged',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: 'string',
                name: 'nodeId',
                type: 'string',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'avaxAmount',
                type: 'uint256',
            },
            {
                indexed: false,
                internalType: 'address',
                name: 'token',
                type: 'address',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'tokenAmount',
                type: 'uint256',
            },
        ],
        name: 'Redeem',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: 'string',
                name: 'nodeId',
                type: 'string',
            },
        ],
        name: 'RegistrationDeleted',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: 'string',
                name: 'nodeId',
                type: 'string',
            },
        ],
        name: 'RegistrationExpired',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'bytes32',
                name: 'role',
                type: 'bytes32',
            },
            {
                indexed: true,
                internalType: 'bytes32',
                name: 'previousAdminRole',
                type: 'bytes32',
            },
            {
                indexed: true,
                internalType: 'bytes32',
                name: 'newAdminRole',
                type: 'bytes32',
            },
        ],
        name: 'RoleAdminChanged',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'bytes32',
                name: 'role',
                type: 'bytes32',
            },
            {
                indexed: true,
                internalType: 'address',
                name: 'account',
                type: 'address',
            },
            {
                indexed: true,
                internalType: 'address',
                name: 'sender',
                type: 'address',
            },
        ],
        name: 'RoleGranted',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'bytes32',
                name: 'role',
                type: 'bytes32',
            },
            {
                indexed: true,
                internalType: 'address',
                name: 'account',
                type: 'address',
            },
            {
                indexed: true,
                internalType: 'address',
                name: 'sender',
                type: 'address',
            },
        ],
        name: 'RoleRevoked',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: 'address',
                name: 'account',
                type: 'address',
            },
        ],
        name: 'Unpaused',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: 'string',
                name: 'nodeId',
                type: 'string',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'amount',
                type: 'uint256',
            },
        ],
        name: 'ValidatorRewarded',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: 'string',
                name: 'nodeId',
                type: 'string',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'qiAmount',
                type: 'uint256',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'avaxAmount',
                type: 'uint256',
            },
        ],
        name: 'ValidatorSlashed',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: 'uint256',
                name: 'amount',
                type: 'uint256',
            },
        ],
        name: 'Withdraw',
        type: 'event',
    },
    {
        inputs: [],
        name: 'AVAX',
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
        name: 'DEFAULT_ADMIN_ROLE',
        outputs: [
            {
                internalType: 'bytes32',
                name: '',
                type: 'bytes32',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'FEE_RECIPIENT',
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
        name: 'ROLE_PAUSE',
        outputs: [
            {
                internalType: 'bytes32',
                name: '',
                type: 'bytes32',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'ROLE_REGISTER_WITHOUT_COLLATERAL',
        outputs: [
            {
                internalType: 'bytes32',
                name: '',
                type: 'bytes32',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'ROLE_RELEASE_LOCKED_TOKENS',
        outputs: [
            {
                internalType: 'bytes32',
                name: '',
                type: 'bytes32',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'ROLE_UNPAUSE',
        outputs: [
            {
                internalType: 'bytes32',
                name: '',
                type: 'bytes32',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'ROLE_WITHDRAW',
        outputs: [
            {
                internalType: 'bytes32',
                name: '',
                type: 'bytes32',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'SLASHED_TOKEN_RECIPIENT',
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
        name: 'VALIDATION_DURATION_EIGHT_WEEKS',
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
        inputs: [],
        name: 'VALIDATION_DURATION_FOUR_WEEKS',
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
        inputs: [],
        name: 'VALIDATION_DURATION_ONE_YEAR',
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
        inputs: [],
        name: 'VALIDATION_DURATION_TWELVE_WEEKS',
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
        inputs: [],
        name: 'VALIDATION_DURATION_TWO_WEEKS',
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
                internalType: 'string',
                name: '',
                type: 'string',
            },
        ],
        name: 'accountRegistrationIndicesByNodeId',
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
                internalType: 'address',
                name: 'token',
                type: 'address',
            },
            {
                internalType: 'address',
                name: 'priceFeedAddress',
                type: 'address',
            },
            {
                internalType: 'uint256',
                name: 'maxPriceAge',
                type: 'uint256',
            },
        ],
        name: 'addPaymentToken',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [],
        name: 'avaxSlashPercentage',
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
                internalType: 'string',
                name: '',
                type: 'string',
            },
        ],
        name: 'blsProofOfPossessionByNodeId',
        outputs: [
            {
                internalType: 'bytes',
                name: '',
                type: 'bytes',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: 'token',
                type: 'address',
            },
            {
                internalType: 'address',
                name: 'priceFeedAddress',
                type: 'address',
            },
            {
                internalType: 'uint256',
                name: 'maxPriceAge',
                type: 'uint256',
            },
        ],
        name: 'configurePriceFeed',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: 'account',
                type: 'address',
            },
        ],
        name: 'getAccountRegistrationCount',
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
        inputs: [],
        name: 'getErc20PaymentMethods',
        outputs: [
            {
                internalType: 'address[]',
                name: '',
                type: 'address[]',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: 'validationDuration',
                type: 'uint256',
            },
        ],
        name: 'getRegistrationFee',
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
                internalType: 'address',
                name: 'account',
                type: 'address',
            },
            {
                internalType: 'uint256',
                name: 'from',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'to',
                type: 'uint256',
            },
        ],
        name: 'getRegistrationsByAccount',
        outputs: [
            {
                components: [
                    {
                        internalType: 'address',
                        name: 'registerer',
                        type: 'address',
                    },
                    {
                        internalType: 'string',
                        name: 'nodeId',
                        type: 'string',
                    },
                    {
                        internalType: 'uint256',
                        name: 'validationDuration',
                        type: 'uint256',
                    },
                    {
                        internalType: 'bool',
                        name: 'feePaid',
                        type: 'bool',
                    },
                    {
                        components: [
                            {
                                internalType: 'uint256',
                                name: 'avaxAmount',
                                type: 'uint256',
                            },
                            {
                                internalType: 'address',
                                name: 'token',
                                type: 'address',
                            },
                            {
                                internalType: 'uint256',
                                name: 'tokenAmount',
                                type: 'uint256',
                            },
                        ],
                        internalType: 'struct IgniteStorage.TokenDepositDetails',
                        name: 'tokenDeposits',
                        type: 'tuple',
                    },
                    {
                        internalType: 'uint256',
                        name: 'rewardAmount',
                        type: 'uint256',
                    },
                    {
                        internalType: 'uint256',
                        name: 'qiSlashPercentage',
                        type: 'uint256',
                    },
                    {
                        internalType: 'uint256',
                        name: 'avaxSlashPercentage',
                        type: 'uint256',
                    },
                    {
                        internalType: 'bool',
                        name: 'slashed',
                        type: 'bool',
                    },
                    {
                        internalType: 'bool',
                        name: 'withdrawable',
                        type: 'bool',
                    },
                ],
                internalType: 'struct IgniteStorage.Registration[]',
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
                internalType: 'bytes32',
                name: 'role',
                type: 'bytes32',
            },
        ],
        name: 'getRoleAdmin',
        outputs: [
            {
                internalType: 'bytes32',
                name: '',
                type: 'bytes32',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'getTotalErc20PaymentMethods',
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
        inputs: [],
        name: 'getTotalRegistrations',
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
                internalType: 'bytes32',
                name: 'role',
                type: 'bytes32',
            },
            {
                internalType: 'address',
                name: 'account',
                type: 'address',
            },
        ],
        name: 'grantRole',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'bytes32',
                name: 'role',
                type: 'bytes32',
            },
            {
                internalType: 'address',
                name: 'account',
                type: 'address',
            },
        ],
        name: 'hasRole',
        outputs: [
            {
                internalType: 'bool',
                name: '',
                type: 'bool',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: '_sAVAX',
                type: 'address',
            },
            {
                internalType: 'address',
                name: '_qi',
                type: 'address',
            },
            {
                internalType: 'address',
                name: '_avaxPriceFeed',
                type: 'address',
            },
            {
                internalType: 'uint256',
                name: '_maxAvaxPriceAge',
                type: 'uint256',
            },
            {
                internalType: 'address',
                name: '_qiPriceFeed',
                type: 'address',
            },
            {
                internalType: 'uint256',
                name: '_maxQiPriceAge',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: '_minimumAvaxDeposit',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: '_maximumAvaxDeposit',
                type: 'uint256',
            },
        ],
        name: 'initialize',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: '',
                type: 'address',
            },
        ],
        name: 'maxPriceAges',
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
        inputs: [],
        name: 'maximumAvaxDeposit',
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
        inputs: [],
        name: 'maximumSubsidisationAmount',
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
        inputs: [],
        name: 'minimumAvaxDeposit',
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
        inputs: [],
        name: 'minimumContractBalance',
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
        inputs: [],
        name: 'pause',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [],
        name: 'paused',
        outputs: [
            {
                internalType: 'bool',
                name: '',
                type: 'bool',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: '',
                type: 'address',
            },
        ],
        name: 'priceFeeds',
        outputs: [
            {
                internalType: 'contract IPriceFeed',
                name: '',
                type: 'address',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'qi',
        outputs: [
            {
                internalType: 'contract IERC20Upgradeable',
                name: '',
                type: 'address',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'qiPriceMultiplier',
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
        inputs: [],
        name: 'qiSlashPercentage',
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
                internalType: 'string',
                name: 'nodeId',
                type: 'string',
            },
        ],
        name: 'redeemAfterExpiry',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'string',
                name: 'nodeId',
                type: 'string',
            },
            {
                internalType: 'bytes',
                name: 'blsProofOfPossession',
                type: 'bytes',
            },
            {
                internalType: 'uint256',
                name: 'validationDuration',
                type: 'uint256',
            },
        ],
        name: 'registerWithAvaxFee',
        outputs: [],
        stateMutability: 'payable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: 'tokenAddress',
                type: 'address',
            },
            {
                internalType: 'string',
                name: 'nodeId',
                type: 'string',
            },
            {
                internalType: 'bytes',
                name: 'blsProofOfPossession',
                type: 'bytes',
            },
            {
                internalType: 'uint256',
                name: 'validationDuration',
                type: 'uint256',
            },
        ],
        name: 'registerWithErc20Fee',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'string',
                name: 'nodeId',
                type: 'string',
            },
            {
                internalType: 'bytes',
                name: 'blsProofOfPossession',
                type: 'bytes',
            },
            {
                internalType: 'uint256',
                name: 'validationDuration',
                type: 'uint256',
            },
        ],
        name: 'registerWithStake',
        outputs: [],
        stateMutability: 'payable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'string',
                name: 'nodeId',
                type: 'string',
            },
            {
                internalType: 'bytes',
                name: 'blsProofOfPossession',
                type: 'bytes',
            },
            {
                internalType: 'uint256',
                name: 'validationDuration',
                type: 'uint256',
            },
        ],
        name: 'registerWithoutCollateral',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: '',
                type: 'address',
            },
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
        ],
        name: 'registeredNodeIdsByAccount',
        outputs: [
            {
                internalType: 'string',
                name: '',
                type: 'string',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'string',
                name: '',
                type: 'string',
            },
        ],
        name: 'registrationIndicesByNodeId',
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
                name: '',
                type: 'uint256',
            },
        ],
        name: 'registrations',
        outputs: [
            {
                internalType: 'address',
                name: 'registerer',
                type: 'address',
            },
            {
                internalType: 'string',
                name: 'nodeId',
                type: 'string',
            },
            {
                internalType: 'uint256',
                name: 'validationDuration',
                type: 'uint256',
            },
            {
                internalType: 'bool',
                name: 'feePaid',
                type: 'bool',
            },
            {
                components: [
                    {
                        internalType: 'uint256',
                        name: 'avaxAmount',
                        type: 'uint256',
                    },
                    {
                        internalType: 'address',
                        name: 'token',
                        type: 'address',
                    },
                    {
                        internalType: 'uint256',
                        name: 'tokenAmount',
                        type: 'uint256',
                    },
                ],
                internalType: 'struct IgniteStorage.TokenDepositDetails',
                name: 'tokenDeposits',
                type: 'tuple',
            },
            {
                internalType: 'uint256',
                name: 'rewardAmount',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'qiSlashPercentage',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'avaxSlashPercentage',
                type: 'uint256',
            },
            {
                internalType: 'bool',
                name: 'slashed',
                type: 'bool',
            },
            {
                internalType: 'bool',
                name: 'withdrawable',
                type: 'bool',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'string',
                name: 'nodeId',
                type: 'string',
            },
            {
                internalType: 'bool',
                name: 'failed',
                type: 'bool',
            },
        ],
        name: 'releaseLockedTokens',
        outputs: [],
        stateMutability: 'payable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: 'token',
                type: 'address',
            },
        ],
        name: 'removePaymentToken',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'bytes32',
                name: 'role',
                type: 'bytes32',
            },
            {
                internalType: 'address',
                name: 'account',
                type: 'address',
            },
        ],
        name: 'renounceRole',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'bytes32',
                name: 'role',
                type: 'bytes32',
            },
            {
                internalType: 'address',
                name: 'account',
                type: 'address',
            },
        ],
        name: 'revokeRole',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [],
        name: 'sAVAX',
        outputs: [
            {
                internalType: 'contract IStakedAvax',
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
                internalType: 'uint256',
                name: 'newMinimumAvaxDeposit',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'newMaximumAvaxDeposit',
                type: 'uint256',
            },
        ],
        name: 'setAvaxDepositRange',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: 'newPercentage',
                type: 'uint256',
            },
        ],
        name: 'setAvaxSlashPercentage',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: 'newMaximumSubsidisationAmount',
                type: 'uint256',
            },
        ],
        name: 'setMaximumSubsidisationAmount',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: 'newQiPriceMultiplier',
                type: 'uint256',
            },
        ],
        name: 'setQiPriceMultiplier',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: 'newPercentage',
                type: 'uint256',
            },
        ],
        name: 'setQiSlashPercentage',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'bytes4',
                name: 'interfaceId',
                type: 'bytes4',
            },
        ],
        name: 'supportsInterface',
        outputs: [
            {
                internalType: 'bool',
                name: '',
                type: 'bool',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'totalSubsidisedAmount',
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
        inputs: [],
        name: 'unpause',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'uint256',
                name: 'amount',
                type: 'uint256',
            },
        ],
        name: 'withdraw',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
] as const;

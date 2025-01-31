export default [
    {
        inputs: [
            {
                internalType: 'string',
                name: '_nativeToken',
                type: 'string',
            },
        ],
        stateMutability: 'nonpayable',
        type: 'constructor',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: 'address',
                name: 'feed',
                type: 'address',
            },
            {
                indexed: false,
                internalType: 'string',
                name: 'symbol',
                type: 'string',
            },
        ],
        name: 'FeedSet',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: 'address',
                name: 'oldAdmin',
                type: 'address',
            },
            {
                indexed: false,
                internalType: 'address',
                name: 'newAdmin',
                type: 'address',
            },
        ],
        name: 'NewAdmin',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: 'address',
                name: 'asset',
                type: 'address',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'previousPriceMantissa',
                type: 'uint256',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'requestedPriceMantissa',
                type: 'uint256',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'newPriceMantissa',
                type: 'uint256',
            },
        ],
        name: 'PricePosted',
        type: 'event',
    },
    {
        inputs: [],
        name: 'admin',
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
                name: 'asset',
                type: 'address',
            },
        ],
        name: 'assetPrices',
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
                name: 'symbol',
                type: 'string',
            },
        ],
        name: 'getFeed',
        outputs: [
            {
                internalType: 'contract AggregatorV3Interface',
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
                internalType: 'contract QiToken',
                name: 'qiToken',
                type: 'address',
            },
        ],
        name: 'getUnderlyingPrice',
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
        name: 'isPriceOracle',
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
        name: 'nativeToken',
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
        inputs: [
            {
                internalType: 'address',
                name: 'newAdmin',
                type: 'address',
            },
        ],
        name: 'setAdmin',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: 'asset',
                type: 'address',
            },
            {
                internalType: 'uint256',
                name: 'price',
                type: 'uint256',
            },
        ],
        name: 'setDirectPrice',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'string',
                name: 'symbol',
                type: 'string',
            },
            {
                internalType: 'address',
                name: 'feed',
                type: 'address',
            },
        ],
        name: 'setFeed',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'contract QiToken',
                name: 'qiToken',
                type: 'address',
            },
            {
                internalType: 'uint256',
                name: 'underlyingPriceMantissa',
                type: 'uint256',
            },
        ],
        name: 'setUnderlyingPrice',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
] as const;

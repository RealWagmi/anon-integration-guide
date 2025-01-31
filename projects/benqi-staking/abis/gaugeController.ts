export default [
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'address',
                name: 'previousOwner',
                type: 'address',
            },
            {
                indexed: true,
                internalType: 'address',
                name: 'newOwner',
                type: 'address',
            },
        ],
        name: 'OwnershipTransferred',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'address',
                name: 'user',
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
                internalType: 'uint256',
                name: 'weight',
                type: 'uint256',
            },
        ],
        name: 'UnvoteNode',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'address',
                name: 'user',
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
                internalType: 'uint256',
                name: 'weight',
                type: 'uint256',
            },
        ],
        name: 'VoteNode',
        type: 'event',
    },
    {
        inputs: [
            {
                internalType: 'string',
                name: '_nodeId',
                type: 'string',
            },
        ],
        name: 'getNodeUsersLength',
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
                name: '_nodeId',
                type: 'string',
            },
            {
                internalType: 'uint256',
                name: '_from',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: '_to',
                type: 'uint256',
            },
        ],
        name: 'getNodeUsersRange',
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
        inputs: [],
        name: 'getNodesLength',
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
                name: '_from',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: '_to',
                type: 'uint256',
            },
        ],
        name: 'getNodesRange',
        outputs: [
            {
                internalType: 'string[]',
                name: '',
                type: 'string[]',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'getUserVotesLength',
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
                name: '_from',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: '_to',
                type: 'uint256',
            },
        ],
        name: 'getUserVotesRange',
        outputs: [
            {
                internalType: 'string[]',
                name: '',
                type: 'string[]',
            },
            {
                internalType: 'uint256[]',
                name: '',
                type: 'uint256[]',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'string',
                name: '_nodeId',
                type: 'string',
            },
        ],
        name: 'getVotesForNode',
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
                name: '_from',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: '_to',
                type: 'uint256',
            },
        ],
        name: 'getVotesRange',
        outputs: [
            {
                internalType: 'string[]',
                name: '',
                type: 'string[]',
            },
            {
                internalType: 'uint256[]',
                name: '',
                type: 'uint256[]',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'contract IVeQi',
                name: '_veQi',
                type: 'address',
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
                internalType: 'string',
                name: '',
                type: 'string',
            },
            {
                internalType: 'address',
                name: '',
                type: 'address',
            },
        ],
        name: 'nodeUserVotedWeight',
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
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
        ],
        name: 'nodeUsers',
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
                internalType: 'string',
                name: '',
                type: 'string',
            },
            {
                internalType: 'address',
                name: '',
                type: 'address',
            },
        ],
        name: 'nodeUsersIndex',
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
        name: 'nodes',
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
        name: 'nodesIndex',
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
        inputs: [],
        name: 'renounceOwnership',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: 'newOwner',
                type: 'address',
            },
        ],
        name: 'transferOwnership',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'string',
                name: '_nodeId',
                type: 'string',
            },
            {
                internalType: 'uint256',
                name: '_weight',
                type: 'uint256',
            },
        ],
        name: 'unvoteNode',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'string[]',
                name: '_nodeIds',
                type: 'string[]',
            },
            {
                internalType: 'uint256[]',
                name: '_weights',
                type: 'uint256[]',
            },
        ],
        name: 'unvoteNodes',
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
        name: 'userVotedNodes',
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
                internalType: 'address',
                name: '',
                type: 'address',
            },
            {
                internalType: 'string',
                name: '',
                type: 'string',
            },
        ],
        name: 'userVotedNodesIndexes',
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
                name: '',
                type: 'address',
            },
        ],
        name: 'userVotedWeight',
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
        name: 'veQi',
        outputs: [
            {
                internalType: 'contract IVeQi',
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
                internalType: 'string',
                name: '_nodeId',
                type: 'string',
            },
            {
                internalType: 'uint256',
                name: '_weight',
                type: 'uint256',
            },
        ],
        name: 'voteNode',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'string[]',
                name: '_nodeIds',
                type: 'string[]',
            },
            {
                internalType: 'uint256[]',
                name: '_weights',
                type: 'uint256[]',
            },
        ],
        name: 'voteNodes',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
] as const;

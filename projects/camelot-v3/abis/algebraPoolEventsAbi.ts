export const algebraPoolEventsAbi = [
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: 'address', name: 'owner', type: 'address' },
            { indexed: true, internalType: 'int24', name: 'bottomTick', type: 'int24' },
            { indexed: true, internalType: 'int24', name: 'topTick', type: 'int24' },
            { indexed: false, internalType: 'uint128', name: 'liquidityAmount', type: 'uint128' },
            { indexed: false, internalType: 'uint256', name: 'amount0', type: 'uint256' },
            { indexed: false, internalType: 'uint256', name: 'amount1', type: 'uint256' },
        ],
        name: 'Burn',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: 'address', name: 'owner', type: 'address' },
            { indexed: false, internalType: 'address', name: 'recipient', type: 'address' },
            { indexed: true, internalType: 'int24', name: 'bottomTick', type: 'int24' },
            { indexed: true, internalType: 'int24', name: 'topTick', type: 'int24' },
            { indexed: false, internalType: 'uint128', name: 'amount0', type: 'uint128' },
            { indexed: false, internalType: 'uint128', name: 'amount1', type: 'uint128' },
        ],
        name: 'Collect',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            { indexed: false, internalType: 'uint8', name: 'communityFee0New', type: 'uint8' },
            { indexed: false, internalType: 'uint8', name: 'communityFee1New', type: 'uint8' },
        ],
        name: 'CommunityFee',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            { indexed: false, internalType: 'uint16', name: 'feeZto', type: 'uint16' },
            { indexed: false, internalType: 'uint16', name: 'feeOtz', type: 'uint16' },
        ],
        name: 'Fee',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: 'address', name: 'sender', type: 'address' },
            { indexed: true, internalType: 'address', name: 'recipient', type: 'address' },
            { indexed: false, internalType: 'uint256', name: 'amount0', type: 'uint256' },
            { indexed: false, internalType: 'uint256', name: 'amount1', type: 'uint256' },
            { indexed: false, internalType: 'uint256', name: 'paid0', type: 'uint256' },
            { indexed: false, internalType: 'uint256', name: 'paid1', type: 'uint256' },
        ],
        name: 'Flash',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: 'address', name: 'virtualPoolAddress', type: 'address' },
        ],
        name: 'Incentive',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            { indexed: false, internalType: 'uint160', name: 'price', type: 'uint160' },
            { indexed: false, internalType: 'int24', name: 'tick', type: 'int24' },
        ],
        name: 'Initialize',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            { indexed: false, internalType: 'uint32', name: 'liquidityCooldown', type: 'uint32' },
        ],
        name: 'LiquidityCooldown',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            { indexed: false, internalType: 'address', name: 'sender', type: 'address' },
            { indexed: true, internalType: 'address', name: 'owner', type: 'address' },
            { indexed: true, internalType: 'int24', name: 'bottomTick', type: 'int24' },
            { indexed: true, internalType: 'int24', name: 'topTick', type: 'int24' },
            { indexed: false, internalType: 'uint128', name: 'liquidityAmount', type: 'uint128' },
            { indexed: false, internalType: 'uint256', name: 'amount0', type: 'uint256' },
            { indexed: false, internalType: 'uint256', name: 'amount1', type: 'uint256' },
        ],
        name: 'Mint',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: 'address', name: 'sender', type: 'address' },
            { indexed: true, internalType: 'address', name: 'recipient', type: 'address' },
            { indexed: false, internalType: 'int256', name: 'amount0', type: 'int256' },
            { indexed: false, internalType: 'int256', name: 'amount1', type: 'int256' },
            { indexed: false, internalType: 'uint160', name: 'price', type: 'uint160' },
            { indexed: false, internalType: 'uint128', name: 'liquidity', type: 'uint128' },
            { indexed: false, internalType: 'int24', name: 'tick', type: 'int24' },
        ],
        name: 'Swap',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            { indexed: false, internalType: 'int24', name: 'newTickSpacing', type: 'int24' },
        ],
        name: 'TickSpacing',
        type: 'event',
    },
] as const;
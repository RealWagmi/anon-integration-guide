export default [
    {
        inputs: [
            { name: '_limit', type: 'uint256' },
            { name: '_offset', type: 'uint256' },
        ],
        name: 'forSwaps',
        outputs: [
            {
                components: [
                    { name: 'lp', type: 'address' },
                    { name: 'type', type: 'int24' },
                    {
                        name: 'token0',
                        type: 'address',
                    },
                    { name: 'token1', type: 'address' },
                    { name: 'factory', type: 'address' },
                    {
                        name: 'pool_fee',
                        type: 'uint256',
                    },
                ],
                name: '',
                type: 'tuple[]',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            { name: '_limit', type: 'uint256' },
            { name: '_offset', type: 'uint256' },
            {
                name: '_account',
                type: 'address',
            },
            { name: '_addresses', type: 'address[]' },
        ],
        name: 'tokens',
        outputs: [
            {
                components: [
                    { name: 'token_address', type: 'address' },
                    {
                        name: 'symbol',
                        type: 'string',
                    },
                    { name: 'decimals', type: 'uint8' },
                    { name: 'account_balance', type: 'uint256' },
                    {
                        name: 'listed',
                        type: 'bool',
                    },
                ],
                name: '',
                type: 'tuple[]',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            { name: '_limit', type: 'uint256' },
            { name: '_offset', type: 'uint256' },
        ],
        name: 'all',
        outputs: [
            {
                components: [
                    { name: 'lp', type: 'address' },
                    { name: 'symbol', type: 'string' },
                    {
                        name: 'decimals',
                        type: 'uint8',
                    },
                    { name: 'liquidity', type: 'uint256' },
                    { name: 'type', type: 'int24' },
                    {
                        name: 'tick',
                        type: 'int24',
                    },
                    { name: 'sqrt_ratio', type: 'uint160' },
                    { name: 'token0', type: 'address' },
                    {
                        name: 'reserve0',
                        type: 'uint256',
                    },
                    { name: 'staked0', type: 'uint256' },
                    { name: 'token1', type: 'address' },
                    {
                        name: 'reserve1',
                        type: 'uint256',
                    },
                    { name: 'staked1', type: 'uint256' },
                    { name: 'gauge', type: 'address' },
                    {
                        name: 'gauge_liquidity',
                        type: 'uint256',
                    },
                    { name: 'gauge_alive', type: 'bool' },
                    { name: 'fee', type: 'address' },
                    {
                        name: 'bribe',
                        type: 'address',
                    },
                    { name: 'factory', type: 'address' },
                    { name: 'emissions', type: 'uint256' },
                    {
                        name: 'emissions_token',
                        type: 'address',
                    },
                    { name: 'pool_fee', type: 'uint256' },
                    { name: 'unstaked_fee', type: 'uint256' },
                    {
                        name: 'token0_fees',
                        type: 'uint256',
                    },
                    { name: 'token1_fees', type: 'uint256' },
                    { name: 'nfpm', type: 'address' },
                    {
                        name: 'alm',
                        type: 'address',
                    },
                    { name: 'root', type: 'address' },
                ],
                name: '',
                type: 'tuple[]',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ name: '_index', type: 'uint256' }],
        name: 'byIndex',
        outputs: [
            {
                components: [
                    { name: 'lp', type: 'address' },
                    { name: 'symbol', type: 'string' },
                    {
                        name: 'decimals',
                        type: 'uint8',
                    },
                    { name: 'liquidity', type: 'uint256' },
                    { name: 'type', type: 'int24' },
                    {
                        name: 'tick',
                        type: 'int24',
                    },
                    { name: 'sqrt_ratio', type: 'uint160' },
                    { name: 'token0', type: 'address' },
                    {
                        name: 'reserve0',
                        type: 'uint256',
                    },
                    { name: 'staked0', type: 'uint256' },
                    { name: 'token1', type: 'address' },
                    {
                        name: 'reserve1',
                        type: 'uint256',
                    },
                    { name: 'staked1', type: 'uint256' },
                    { name: 'gauge', type: 'address' },
                    {
                        name: 'gauge_liquidity',
                        type: 'uint256',
                    },
                    { name: 'gauge_alive', type: 'bool' },
                    { name: 'fee', type: 'address' },
                    {
                        name: 'bribe',
                        type: 'address',
                    },
                    { name: 'factory', type: 'address' },
                    { name: 'emissions', type: 'uint256' },
                    {
                        name: 'emissions_token',
                        type: 'address',
                    },
                    { name: 'pool_fee', type: 'uint256' },
                    { name: 'unstaked_fee', type: 'uint256' },
                    {
                        name: 'token0_fees',
                        type: 'uint256',
                    },
                    { name: 'token1_fees', type: 'uint256' },
                    { name: 'nfpm', type: 'address' },
                    {
                        name: 'alm',
                        type: 'address',
                    },
                    { name: 'root', type: 'address' },
                ],
                name: '',
                type: 'tuple',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            { name: '_limit', type: 'uint256' },
            { name: '_offset', type: 'uint256' },
            {
                name: '_account',
                type: 'address',
            },
        ],
        name: 'positions',
        outputs: [
            {
                components: [
                    { name: 'id', type: 'uint256' },
                    {
                        name: 'lp',
                        type: 'address',
                    },
                    { name: 'liquidity', type: 'uint256' },
                    { name: 'staked', type: 'uint256' },
                    {
                        name: 'amount0',
                        type: 'uint256',
                    },
                    { name: 'amount1', type: 'uint256' },
                    { name: 'staked0', type: 'uint256' },
                    {
                        name: 'staked1',
                        type: 'uint256',
                    },
                    { name: 'unstaked_earned0', type: 'uint256' },
                    {
                        name: 'unstaked_earned1',
                        type: 'uint256',
                    },
                    { name: 'emissions_earned', type: 'uint256' },
                    {
                        name: 'tick_lower',
                        type: 'int24',
                    },
                    { name: 'tick_upper', type: 'int24' },
                    {
                        name: 'sqrt_ratio_lower',
                        type: 'uint160',
                    },
                    { name: 'sqrt_ratio_upper', type: 'uint160' },
                    { name: 'alm', type: 'address' },
                ],
                name: '',
                type: 'tuple[]',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            { name: '_limit', type: 'uint256' },
            { name: '_offset', type: 'uint256' },
            {
                name: '_account',
                type: 'address',
            },
            { name: '_factory', type: 'address' },
        ],
        name: 'positionsByFactory',
        outputs: [
            {
                components: [
                    { name: 'id', type: 'uint256' },
                    {
                        name: 'lp',
                        type: 'address',
                    },
                    { name: 'liquidity', type: 'uint256' },
                    { name: 'staked', type: 'uint256' },
                    {
                        name: 'amount0',
                        type: 'uint256',
                    },
                    { name: 'amount1', type: 'uint256' },
                    { name: 'staked0', type: 'uint256' },
                    {
                        name: 'staked1',
                        type: 'uint256',
                    },
                    { name: 'unstaked_earned0', type: 'uint256' },
                    {
                        name: 'unstaked_earned1',
                        type: 'uint256',
                    },
                    { name: 'emissions_earned', type: 'uint256' },
                    {
                        name: 'tick_lower',
                        type: 'int24',
                    },
                    { name: 'tick_upper', type: 'int24' },
                    {
                        name: 'sqrt_ratio_lower',
                        type: 'uint160',
                    },
                    { name: 'sqrt_ratio_upper', type: 'uint160' },
                    { name: 'alm', type: 'address' },
                ],
                name: '',
                type: 'tuple[]',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            { name: '_limit', type: 'uint256' },
            { name: '_offset', type: 'uint256' },
            {
                name: '_account',
                type: 'address',
            },
        ],
        name: 'positionsUnstakedConcentrated',
        outputs: [
            {
                components: [
                    { name: 'id', type: 'uint256' },
                    {
                        name: 'lp',
                        type: 'address',
                    },
                    { name: 'liquidity', type: 'uint256' },
                    { name: 'staked', type: 'uint256' },
                    {
                        name: 'amount0',
                        type: 'uint256',
                    },
                    { name: 'amount1', type: 'uint256' },
                    { name: 'staked0', type: 'uint256' },
                    {
                        name: 'staked1',
                        type: 'uint256',
                    },
                    { name: 'unstaked_earned0', type: 'uint256' },
                    {
                        name: 'unstaked_earned1',
                        type: 'uint256',
                    },
                    { name: 'emissions_earned', type: 'uint256' },
                    {
                        name: 'tick_lower',
                        type: 'int24',
                    },
                    { name: 'tick_upper', type: 'int24' },
                    {
                        name: 'sqrt_ratio_lower',
                        type: 'uint160',
                    },
                    { name: 'sqrt_ratio_upper', type: 'uint160' },
                    { name: 'alm', type: 'address' },
                ],
                name: '',
                type: 'tuple[]',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            { name: '_wrapper', type: 'address' },
            { name: '_amount0', type: 'uint256' },
            {
                name: '_amount1',
                type: 'uint256',
            },
        ],
        name: 'almEstimateAmounts',
        outputs: [{ name: '', type: 'uint256[3]' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'MAX_TOKENS',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'MAX_LPS',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'MAX_POSITIONS',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'MAX_TOKEN_SYMBOL_LEN',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'cl_helper',
        outputs: [{ name: '', type: 'address' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'alm_factory',
        outputs: [{ name: '', type: 'address' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            { name: '_voter', type: 'address' },
            { name: '_registry', type: 'address' },
            {
                name: '_convertor',
                type: 'address',
            },
            { name: '_slipstream_helper', type: 'address' },
            { name: '_alm_factory', type: 'address' },
        ],
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'constructor',
    },
] as const;

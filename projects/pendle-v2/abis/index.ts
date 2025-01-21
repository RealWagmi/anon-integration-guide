export const marketAbi = require("./IPMarket.json").abi;

export const actionAddRemoveLiqV3Abi = [
    // ... existing functions ...
    {
        inputs: [
            { name: 'receiver', type: 'address' },
            { name: 'market', type: 'address' },
            { name: 'netLpToRemove', type: 'uint256' },
            { name: 'minSyOut', type: 'uint256' },
            { name: 'minPtOut', type: 'uint256' }
        ],
        name: 'removeLiquidityDualSyAndPt',
        outputs: [
            { name: 'netSyOut', type: 'uint256' },
            { name: 'netPtOut', type: 'uint256' }
        ],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            { name: 'receiver', type: 'address' },
            { name: 'market', type: 'address' },
            { name: 'netLpToRemove', type: 'uint256' },
            {
                components: [
                    { name: 'tokenOut', type: 'address' },
                    { name: 'minTokenOut', type: 'uint256' },
                    { name: 'bulk', type: 'bool' }
                ],
                name: 'output',
                type: 'tuple'
            },
            {
                components: [
                    { name: 'guessMin', type: 'uint256' },
                    { name: 'guessMax', type: 'uint256' },
                    { name: 'guessOffchain', type: 'uint256' },
                    { name: 'maxIteration', type: 'uint256' },
                    { name: 'eps', type: 'uint256' }
                ],
                name: 'guessPtToToken',
                type: 'tuple'
            },
            {
                components: [
                    { name: 'deadline', type: 'uint256' },
                    { name: 'limitPrice', type: 'uint256' }
                ],
                name: 'limit',
                type: 'tuple'
            }
        ],
        name: 'removeLiquiditySingleToken',
        outputs: [
            { name: 'netTokenOut', type: 'uint256' },
            { name: 'netSyFee', type: 'uint256' },
            { name: 'netSyInterm', type: 'uint256' }
        ],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            { name: 'receiver', type: 'address' },
            { name: 'market', type: 'address' },
            { name: 'netLpToRemove', type: 'uint256' },
            { name: 'minSyOut', type: 'uint256' },
            {
                components: [
                    { name: 'guessMin', type: 'uint256' },
                    { name: 'guessMax', type: 'uint256' },
                    { name: 'guessOffchain', type: 'uint256' },
                    { name: 'maxIteration', type: 'uint256' },
                    { name: 'eps', type: 'uint256' }
                ],
                name: 'guessPtToSy',
                type: 'tuple'
            },
            {
                components: [
                    { name: 'deadline', type: 'uint256' },
                    { name: 'limitPrice', type: 'uint256' }
                ],
                name: 'limit',
                type: 'tuple'
            }
        ],
        name: 'removeLiquiditySingleSy',
        outputs: [
            { name: 'netSyOut', type: 'uint256' },
            { name: 'netSyFee', type: 'uint256' }
        ],
        stateMutability: 'nonpayable',
        type: 'function'
    }
] as const; 
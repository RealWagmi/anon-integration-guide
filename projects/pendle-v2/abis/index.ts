// Export all ABIs
export const marketAbi = require("./IPMarket.json").abi.concat([
    {
        inputs: [{ type: 'uint32[]', name: 'secondsAgos' }],
        name: 'observe',
        outputs: [{ type: 'uint216[]', name: 'lnImpliedRateCumulative' }],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [],
        name: '_storage',
        outputs: [
            { name: 'totalPt', type: 'int128' },
            { name: 'totalSy', type: 'int128' },
            { name: 'lastLnImpliedRate', type: 'uint96' },
            { name: 'observationIndex', type: 'uint16' },
            { name: 'observationCardinality', type: 'uint16' },
            { name: 'observationCardinalityNext', type: 'uint16' }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [{ type: 'uint256', name: '' }],
        name: 'observations',
        outputs: [
            { name: 'blockTimestamp', type: 'uint32' },
            { name: 'lnImpliedRateCumulative', type: 'uint216' },
            { name: 'initialized', type: 'bool' }
        ],
        stateMutability: 'view',
        type: 'function'
    }
] as const);
export const gaugeControllerAbi = require("./IPGaugeController.json").abi;
export const feeDistributorAbi = require("./IPFeeDistributor.json").abi;
export const marketFactoryAbi = require("./IPMarketFactory.json").abi;
export const votingEscrowAbi = require("./IPVotingEscrow.json").abi;
export const routerAbi = require("./IPRouter.json").abi;
export const pendleMsgReceiveEndpointAbi = require("./IPendleMsgReceiveEndpoint.json").abi;
export const pendleGaugeAbi = [
    {
        inputs: [],
        name: 'totalActiveSupply',
        outputs: [{ type: 'uint256', name: '' }],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [{ type: 'address', name: 'user' }],
        name: 'activeBalance',
        outputs: [{ type: 'uint256', name: '' }],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [{ type: 'address', name: 'user' }],
        name: 'redeemRewards',
        outputs: [{ type: 'uint256[]', name: 'rewardsOut' }],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [],
        name: 'getRewardTokens',
        outputs: [{ type: 'address[]', name: '' }],
        stateMutability: 'view',
        type: 'function'
    }
] as const;

// Re-export types
export type { IPMarket } from "./types/IPMarket";
export type { IPGaugeController } from "./types/IPGaugeController";
export type { IPFeeDistributor } from "./types/IPFeeDistributor";
export type { IPMarketFactory } from "./types/IPMarketFactory";
export type { IPVotingEscrow } from "./types/IPVotingEscrow";
export type { IPRouter } from "./types/IPRouter";
export type { IPendleMsgReceiveEndpoint } from "./types/IPendleMsgReceiveEndpoint";

// PY Index ABI
export const pyIndexAbi = [
    {
        inputs: [],
        name: 'pyIndexCurrent',
        outputs: [{ type: 'uint256', name: '' }],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [
            { type: 'uint256', name: 'index' },
            { type: 'uint256', name: 'syAmount' }
        ],
        name: 'syToAsset',
        outputs: [{ type: 'uint256', name: '' }],
        stateMutability: 'pure',
        type: 'function'
    },
    {
        inputs: [
            { type: 'uint256', name: 'index' },
            { type: 'uint256', name: 'assetAmount' }
        ],
        name: 'assetToSy',
        outputs: [{ type: 'uint256', name: '' }],
        stateMutability: 'pure',
        type: 'function'
    },
    {
        inputs: [
            { type: 'uint256', name: 'index' },
            { type: 'uint256', name: 'syAmount' }
        ],
        name: 'syToAssetUp',
        outputs: [{ type: 'uint256', name: '' }],
        stateMutability: 'pure',
        type: 'function'
    },
    {
        inputs: [
            { type: 'uint256', name: 'index' },
            { type: 'uint256', name: 'assetAmount' }
        ],
        name: 'assetToSyUp',
        outputs: [{ type: 'uint256', name: '' }],
        stateMutability: 'pure',
        type: 'function'
    }
] as const;

// PT Swap ABI
export const actionSwapPTV3Abi = [
    {
        inputs: [
            { type: 'address', name: 'receiver' },
            { type: 'address', name: 'market' },
            { type: 'uint256', name: 'minPtOut' },
            {
                type: 'tuple',
                name: 'guessPtOut',
                components: [
                    { type: 'string', name: 'guessMin' },
                    { type: 'string', name: 'guessMax' },
                    { type: 'string', name: 'guessOffchain' },
                    { type: 'uint256', name: 'maxIteration' },
                    { type: 'string', name: 'eps' }
                ]
            },
            {
                type: 'tuple',
                name: 'input',
                components: [
                    { type: 'address', name: 'tokenIn' },
                    { type: 'string', name: 'amountIn' },
                    { type: 'address', name: 'tokenMintSy' },
                    { type: 'bool', name: 'bulk' }
                ]
            },
            {
                type: 'tuple',
                name: 'limit',
                components: [
                    { type: 'uint256', name: 'deadline' },
                    { type: 'string', name: 'limitPrice' }
                ]
            }
        ],
        name: 'swapExactTokenForPt',
        outputs: [
            { type: 'uint256', name: 'netPtOut' },
            { type: 'uint256', name: 'netSyFee' },
            { type: 'uint256', name: 'netSyInterm' }
        ],
        stateMutability: 'payable',
        type: 'function'
    },
    {
        inputs: [
            { type: 'address', name: 'receiver' },
            { type: 'address', name: 'market' },
            { type: 'uint256', name: 'exactSyIn' },
            { type: 'uint256', name: 'minPtOut' },
            {
                type: 'tuple',
                name: 'guessPtOut',
                components: [
                    { type: 'string', name: 'guessMin' },
                    { type: 'string', name: 'guessMax' },
                    { type: 'string', name: 'guessOffchain' },
                    { type: 'uint256', name: 'maxIteration' },
                    { type: 'string', name: 'eps' }
                ]
            },
            {
                type: 'tuple',
                name: 'limit',
                components: [
                    { type: 'uint256', name: 'deadline' },
                    { type: 'string', name: 'limitPrice' }
                ]
            }
        ],
        name: 'swapExactSyForPt',
        outputs: [
            { type: 'uint256', name: 'netPtOut' },
            { type: 'uint256', name: 'netSyFee' }
        ],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            { type: 'address', name: 'receiver' },
            { type: 'address', name: 'market' },
            { type: 'uint256', name: 'exactPtIn' },
            {
                type: 'tuple',
                name: 'output',
                components: [
                    { type: 'address', name: 'tokenOut' },
                    { type: 'string', name: 'minTokenOut' },
                    { type: 'bool', name: 'bulk' }
                ]
            },
            {
                type: 'tuple',
                name: 'limit',
                components: [
                    { type: 'uint256', name: 'deadline' },
                    { type: 'string', name: 'limitPrice' }
                ]
            }
        ],
        name: 'swapExactPtForToken',
        outputs: [
            { type: 'uint256', name: 'netTokenOut' },
            { type: 'uint256', name: 'netSyFee' },
            { type: 'uint256', name: 'netSyInterm' }
        ],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            { type: 'address', name: 'receiver' },
            { type: 'address', name: 'market' },
            { type: 'uint256', name: 'exactPtIn' },
            { type: 'uint256', name: 'minSyOut' },
            {
                type: 'tuple',
                name: 'limit',
                components: [
                    { type: 'uint256', name: 'deadline' },
                    { type: 'string', name: 'limitPrice' }
                ]
            }
        ],
        name: 'swapExactPtForSy',
        outputs: [
            { type: 'uint256', name: 'netSyOut' },
            { type: 'uint256', name: 'netSyFee' }
        ],
        stateMutability: 'nonpayable',
        type: 'function'
    }
] as const;

// YT Swap ABI
export const actionSwapYTV3Abi = [
    {
        inputs: [
            { type: 'address', name: 'receiver' },
            { type: 'address', name: 'market' },
            { type: 'uint256', name: 'minYtOut' },
            {
                type: 'tuple',
                name: 'guessYtOut',
                components: [
                    { type: 'string', name: 'guessMin' },
                    { type: 'string', name: 'guessMax' },
                    { type: 'string', name: 'guessOffchain' },
                    { type: 'uint256', name: 'maxIteration' },
                    { type: 'string', name: 'eps' }
                ]
            },
            {
                type: 'tuple',
                name: 'input',
                components: [
                    { type: 'address', name: 'tokenIn' },
                    { type: 'string', name: 'amountIn' },
                    { type: 'address', name: 'tokenMintSy' },
                    { type: 'bool', name: 'bulk' }
                ]
            },
            {
                type: 'tuple',
                name: 'limit',
                components: [
                    { type: 'uint256', name: 'deadline' },
                    { type: 'string', name: 'limitPrice' }
                ]
            }
        ],
        name: 'swapExactTokenForYt',
        outputs: [
            { type: 'uint256', name: 'netYtOut' },
            { type: 'uint256', name: 'netSyFee' },
            { type: 'uint256', name: 'netSyInterm' }
        ],
        stateMutability: 'payable',
        type: 'function'
    },
    {
        inputs: [
            { type: 'address', name: 'receiver' },
            { type: 'address', name: 'market' },
            { type: 'uint256', name: 'exactSyIn' },
            { type: 'uint256', name: 'minYtOut' },
            {
                type: 'tuple',
                name: 'guessYtOut',
                components: [
                    { type: 'string', name: 'guessMin' },
                    { type: 'string', name: 'guessMax' },
                    { type: 'string', name: 'guessOffchain' },
                    { type: 'uint256', name: 'maxIteration' },
                    { type: 'string', name: 'eps' }
                ]
            },
            {
                type: 'tuple',
                name: 'limit',
                components: [
                    { type: 'uint256', name: 'deadline' },
                    { type: 'string', name: 'limitPrice' }
                ]
            }
        ],
        name: 'swapExactSyForYt',
        outputs: [
            { type: 'uint256', name: 'netYtOut' },
            { type: 'uint256', name: 'netSyFee' }
        ],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            { type: 'address', name: 'receiver' },
            { type: 'address', name: 'market' },
            { type: 'uint256', name: 'exactYtIn' },
            {
                type: 'tuple',
                name: 'output',
                components: [
                    { type: 'address', name: 'tokenOut' },
                    { type: 'string', name: 'minTokenOut' },
                    { type: 'bool', name: 'bulk' }
                ]
            },
            {
                type: 'tuple',
                name: 'limit',
                components: [
                    { type: 'uint256', name: 'deadline' },
                    { type: 'string', name: 'limitPrice' }
                ]
            }
        ],
        name: 'swapExactYtForToken',
        outputs: [
            { type: 'uint256', name: 'netTokenOut' },
            { type: 'uint256', name: 'netSyFee' },
            { type: 'uint256', name: 'netSyInterm' }
        ],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            { type: 'address', name: 'receiver' },
            { type: 'address', name: 'market' },
            { type: 'uint256', name: 'exactYtIn' },
            { type: 'uint256', name: 'minSyOut' },
            {
                type: 'tuple',
                name: 'limit',
                components: [
                    { type: 'uint256', name: 'deadline' },
                    { type: 'string', name: 'limitPrice' }
                ]
            }
        ],
        name: 'swapExactYtForSy',
        outputs: [
            { type: 'uint256', name: 'netSyOut' },
            { type: 'uint256', name: 'netSyFee' }
        ],
        stateMutability: 'nonpayable',
        type: 'function'
    }
] as const;

// Merkle Distributor ABI
export const merkleDistributorAbi = [
    {
        inputs: [
            { type: 'address', name: 'receiver' },
            { type: 'uint256', name: 'totalAccrued' },
            { type: 'bytes32[]', name: 'proof' }
        ],
        name: 'claim',
        outputs: [{ type: 'uint256', name: 'amountOut' }],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [{ type: 'address', name: 'receiver' }],
        name: 'claimVerified',
        outputs: [{ type: 'uint256', name: 'amountOut' }],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            { type: 'address', name: 'user' },
            { type: 'uint256', name: 'totalAccrued' },
            { type: 'bytes32[]', name: 'proof' }
        ],
        name: 'verify',
        outputs: [{ type: 'uint256', name: 'amountClaimable' }],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [{ type: 'bytes32', name: 'newMerkleRoot' }],
        name: 'setMerkleRoot',
        outputs: [],
        stateMutability: 'payable',
        type: 'function'
    },
    {
        inputs: [{ type: 'address', name: '' }],
        name: 'claimed',
        outputs: [{ type: 'uint256', name: '' }],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [{ type: 'address', name: '' }],
        name: 'verified',
        outputs: [{ type: 'uint256', name: '' }],
        stateMutability: 'view',
        type: 'function'
    }
] as const;

// Multi-Token Merkle Distributor ABI
export const multiTokenMerkleDistributorAbi = [
    {
        inputs: [
            { type: 'address', name: 'receiver' },
            { type: 'address[]', name: 'tokens' },
            { type: 'uint256[]', name: 'totalAccrueds' },
            { type: 'bytes32[][]', name: 'proofs' }
        ],
        name: 'claim',
        outputs: [{ type: 'uint256[]', name: 'amountOuts' }],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            { type: 'address', name: 'receiver' },
            { type: 'address[]', name: 'tokens' }
        ],
        name: 'claimVerified',
        outputs: [{ type: 'uint256[]', name: 'amountOuts' }],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            { type: 'address', name: 'user' },
            { type: 'address[]', name: 'tokens' },
            { type: 'uint256[]', name: 'totalAccrueds' },
            { type: 'bytes32[][]', name: 'proofs' }
        ],
        name: 'verify',
        outputs: [{ type: 'uint256[]', name: 'amountClaimable' }],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [{ type: 'bytes32', name: 'newMerkleRoot' }],
        name: 'setMerkleRoot',
        outputs: [],
        stateMutability: 'payable',
        type: 'function'
    },
    {
        inputs: [
            { type: 'address', name: '' },
            { type: 'address', name: '' }
        ],
        name: 'claimed',
        outputs: [{ type: 'uint256', name: '' }],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [
            { type: 'address', name: '' },
            { type: 'address', name: '' }
        ],
        name: 'verified',
        outputs: [{ type: 'uint256', name: '' }],
        stateMutability: 'view',
        type: 'function'
    }
] as const;

// Voting Controller ABI
export const votingControllerAbi = [
    {
        inputs: [
            { type: 'address[]', name: 'pools' },
            { type: 'uint256[]', name: 'weights' }
        ],
        name: 'vote',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [{ type: 'address', name: 'pool' }],
        name: 'applyPoolSlopeChanges',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            { type: 'uint256', name: 'wTime' },
            { type: 'address[]', name: 'pools' }
        ],
        name: 'getWeekData',
        outputs: [
            { type: 'bool', name: 'isEpochFinalized' },
            { type: 'uint256', name: 'totalVotes' },
            { type: 'uint256[]', name: 'poolVotes' }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [
            { type: 'address', name: 'pool' },
            { type: 'uint256', name: 'wTime' }
        ],
        name: 'getPoolTotalVoteAt',
        outputs: [{ type: 'uint256', name: '' }],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [],
        name: 'finalizeEpoch',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [{ type: 'uint256', name: 'chainId' }],
        name: 'getBroadcastResultFee',
        outputs: [{ type: 'uint256', name: '' }],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [{ type: 'uint256', name: 'chainId' }],
        name: 'broadcastResults',
        outputs: [],
        stateMutability: 'payable',
        type: 'function'
    }
] as const;

export const actionMiscV3Abi = [
    {
        inputs: [
            { name: 'receiver', type: 'address' },
            { name: 'SY', type: 'address' },
            { name: 'minSyOut', type: 'uint256' },
            {
                components: [
                    { name: 'tokenIn', type: 'address' },
                    { name: 'netTokenIn', type: 'uint256' },
                    { name: 'tokenMintSy', type: 'address' },
                    { name: 'bulk', type: 'bytes' }
                ],
                name: 'input',
                type: 'tuple'
            }
        ],
        name: 'mintSyFromToken',
        outputs: [{ name: 'netSyOut', type: 'uint256' }],
        stateMutability: 'payable',
        type: 'function'
    },
    {
        inputs: [
            { name: 'receiver', type: 'address' },
            { name: 'SY', type: 'address' },
            { name: 'netSyIn', type: 'uint256' },
            {
                components: [
                    { name: 'tokenOut', type: 'address' },
                    { name: 'minTokenOut', type: 'uint256' },
                    { name: 'bulk', type: 'bytes' }
                ],
                name: 'output',
                type: 'tuple'
            }
        ],
        name: 'redeemSyToToken',
        outputs: [{ name: 'netTokenOut', type: 'uint256' }],
        stateMutability: 'payable',
        type: 'function'
    },
    {
        inputs: [
            { name: 'receiver', type: 'address' },
            { name: 'YT', type: 'address' },
            { name: 'minPyOut', type: 'uint256' },
            {
                components: [
                    { name: 'tokenIn', type: 'address' },
                    { name: 'netTokenIn', type: 'uint256' },
                    { name: 'tokenMintSy', type: 'address' },
                    { name: 'bulk', type: 'bytes' }
                ],
                name: 'input',
                type: 'tuple'
            }
        ],
        name: 'mintPyFromToken',
        outputs: [
            { name: 'netPyOut', type: 'uint256' },
            { name: 'netSyInterm', type: 'uint256' }
        ],
        stateMutability: 'payable',
        type: 'function'
    },
    {
        inputs: [
            { name: 'receiver', type: 'address' },
            { name: 'YT', type: 'address' },
            { name: 'netPyIn', type: 'uint256' },
            {
                components: [
                    { name: 'tokenOut', type: 'address' },
                    { name: 'minTokenOut', type: 'uint256' },
                    { name: 'bulk', type: 'bytes' }
                ],
                name: 'output',
                type: 'tuple'
            }
        ],
        name: 'redeemPyToToken',
        outputs: [
            { name: 'netTokenOut', type: 'uint256' },
            { name: 'netSyInterm', type: 'uint256' }
        ],
        stateMutability: 'payable',
        type: 'function'
    },
    {
        inputs: [
            { name: 'receiver', type: 'address' },
            { name: 'YT', type: 'address' },
            { name: 'netSyIn', type: 'uint256' },
            { name: 'minPyOut', type: 'uint256' }
        ],
        name: 'mintPyFromSy',
        outputs: [{ name: 'netPyOut', type: 'uint256' }],
        stateMutability: 'payable',
        type: 'function'
    },
    {
        inputs: [
            { name: 'receiver', type: 'address' },
            { name: 'YT', type: 'address' },
            { name: 'netPyIn', type: 'uint256' },
            { name: 'minSyOut', type: 'uint256' }
        ],
        name: 'redeemPyToSy',
        outputs: [{ name: 'netSyOut', type: 'uint256' }],
        stateMutability: 'payable',
        type: 'function'
    },
    {
        inputs: [
            { name: 'user', type: 'address' },
            { name: 'sys', type: 'address[]' },
            { name: 'yts', type: 'address[]' },
            { name: 'markets', type: 'address[]' }
        ],
        name: 'redeemDueInterestAndRewards',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            { name: 'receiver', type: 'address' },
            { name: 'market', type: 'address' },
            { name: 'netPtIn', type: 'uint256' },
            { name: 'netYtIn', type: 'uint256' },
            { name: 'netLpIn', type: 'uint256' },
            {
                components: [
                    { name: 'tokenOut', type: 'address' },
                    { name: 'minTokenOut', type: 'uint256' },
                    { name: 'bulk', type: 'bytes' }
                ],
                name: 'output',
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
        name: 'exitPreExpToToken',
        outputs: [
            { name: 'totalTokenOut', type: 'uint256' },
            {
                components: [
                    { name: 'netSyFeeFromPt', type: 'uint256' },
                    { name: 'netSyFeeFromYt', type: 'uint256' },
                    { name: 'netSyFromPt', type: 'uint256' },
                    { name: 'netSyFromYt', type: 'uint256' },
                    { name: 'netSyFromLp', type: 'uint256' },
                    { name: 'totalSyOut', type: 'uint256' }
                ],
                name: 'params',
                type: 'tuple'
            }
        ],
        stateMutability: 'payable',
        type: 'function'
    },
    {
        inputs: [
            { name: 'receiver', type: 'address' },
            { name: 'market', type: 'address' },
            { name: 'netPtIn', type: 'uint256' },
            { name: 'netYtIn', type: 'uint256' },
            { name: 'netLpIn', type: 'uint256' },
            { name: 'minSyOut', type: 'uint256' },
            {
                components: [
                    { name: 'deadline', type: 'uint256' },
                    { name: 'limitPrice', type: 'uint256' }
                ],
                name: 'limit',
                type: 'tuple'
            }
        ],
        name: 'exitPreExpToSy',
        outputs: [
            {
                components: [
                    { name: 'netSyFeeFromPt', type: 'uint256' },
                    { name: 'netSyFeeFromYt', type: 'uint256' },
                    { name: 'netSyFromPt', type: 'uint256' },
                    { name: 'netSyFromYt', type: 'uint256' },
                    { name: 'netSyFromLp', type: 'uint256' },
                    { name: 'totalSyOut', type: 'uint256' }
                ],
                name: 'params',
                type: 'tuple'
            }
        ],
        stateMutability: 'payable',
        type: 'function'
    }
] as const;

export const feeDistributorV2Abi = [
    {
        inputs: [
            { type: 'address', name: 'receiver' },
            { type: 'uint256', name: 'totalAccrued' },
            { type: 'bytes32[]', name: 'proof' }
        ],
        name: 'claimRetail',
        outputs: [{ type: 'uint256', name: 'amountOut' }],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            { type: 'address', name: 'receiver' },
            { type: 'address[]', name: 'pools' }
        ],
        name: 'claimProtocol',
        outputs: [
            { type: 'uint256', name: 'totalAmountOut' },
            { type: 'uint256[]', name: 'amountsOut' }
        ],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            { type: 'address', name: 'user' },
            { type: 'address[]', name: 'pools' }
        ],
        name: 'getProtocolClaimables',
        outputs: [{ type: 'uint256[]', name: 'claimables' }],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [{ type: 'address', name: 'user' }],
        name: 'getProtocolTotalAccrued',
        outputs: [{ type: 'uint256', name: '' }],
        stateMutability: 'view',
        type: 'function'
    }
] as const;

export const limitRouterAbi = [
    {
        inputs: [
            {
                type: 'tuple[]',
                name: 'params',
                components: [
                    {
                        type: 'tuple',
                        name: 'order',
                        components: [
                            { type: 'uint256', name: 'salt' },
                            { type: 'uint256', name: 'expiry' },
                            { type: 'uint256', name: 'nonce' },
                            { type: 'uint8', name: 'orderType' },
                            { type: 'address', name: 'token' },
                            { type: 'address', name: 'YT' },
                            { type: 'address', name: 'maker' },
                            { type: 'address', name: 'receiver' },
                            { type: 'uint256', name: 'makingAmount' },
                            { type: 'uint256', name: 'lnImpliedRate' },
                            { type: 'uint256', name: 'failSafeRate' },
                            { type: 'bytes', name: 'permit' }
                        ]
                    },
                    { type: 'uint256', name: 'makingAmount' },
                    { type: 'bytes', name: 'signature' }
                ]
            },
            { type: 'address', name: 'receiver' },
            { type: 'uint256', name: 'maxTaking' },
            { type: 'bytes', name: 'optData' },
            { type: 'bytes', name: 'callback' }
        ],
        name: 'fill',
        outputs: [
            { type: 'uint256', name: 'actualMaking' },
            { type: 'uint256', name: 'actualTaking' },
            { type: 'uint256', name: 'totalFee' },
            { type: 'bytes', name: 'callbackReturn' }
        ],
        stateMutability: 'payable',
        type: 'function'
    },
    {
        inputs: [{ type: 'tuple[]', name: 'orders', components: [
            { type: 'uint256', name: 'salt' },
            { type: 'uint256', name: 'expiry' },
            { type: 'uint256', name: 'nonce' },
            { type: 'uint8', name: 'orderType' },
            { type: 'address', name: 'token' },
            { type: 'address', name: 'YT' },
            { type: 'address', name: 'maker' },
            { type: 'address', name: 'receiver' },
            { type: 'uint256', name: 'makingAmount' },
            { type: 'uint256', name: 'lnImpliedRate' },
            { type: 'uint256', name: 'failSafeRate' },
            { type: 'bytes', name: 'permit' }
        ] }],
        name: 'cancelBatch',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [{ type: 'tuple', name: 'order', components: [
            { type: 'uint256', name: 'salt' },
            { type: 'uint256', name: 'expiry' },
            { type: 'uint256', name: 'nonce' },
            { type: 'uint8', name: 'orderType' },
            { type: 'address', name: 'token' },
            { type: 'address', name: 'YT' },
            { type: 'address', name: 'maker' },
            { type: 'address', name: 'receiver' },
            { type: 'uint256', name: 'makingAmount' },
            { type: 'uint256', name: 'lnImpliedRate' },
            { type: 'uint256', name: 'failSafeRate' },
            { type: 'bytes', name: 'permit' }
        ] }],
        name: 'cancelSingle',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [{ type: 'bytes32[]', name: 'orderHashes' }],
        name: 'orderStatuses',
        outputs: [
            { type: 'uint256[]', name: 'remainings' },
            { type: 'uint256[]', name: 'filledAmounts' }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [],
        name: 'DOMAIN_SEPARATOR',
        outputs: [{ type: 'bytes32', name: '' }],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [
            { type: 'address', name: 'target' },
            { type: 'bytes', name: 'data' }
        ],
        name: 'simulate',
        outputs: [
            { type: 'bool', name: 'success' },
            { type: 'bytes', name: 'result' }
        ],
        stateMutability: 'payable',
        type: 'function'
    }
] as const;

export const actionAddRemoveLiqV3Abi = [
    {
        inputs: [
            { name: 'receiver', type: 'address' },
            { name: 'market', type: 'address' },
            {
                components: [
                    { name: 'tokenIn', type: 'address' },
                    { name: 'netTokenIn', type: 'uint256' },
                    { name: 'tokenMintSy', type: 'address' },
                    { name: 'bulk', type: 'bool' }
                ],
                name: 'input',
                type: 'tuple'
            },
            { name: 'netPtDesired', type: 'uint256' },
            { name: 'minLpOut', type: 'uint256' }
        ],
        name: 'addLiquidityDualTokenAndPt',
        outputs: [
            { name: 'netLpOut', type: 'uint256' },
            { name: 'netPtUsed', type: 'uint256' },
            { name: 'netSyInterm', type: 'uint256' }
        ],
        stateMutability: 'payable',
        type: 'function'
    },
    {
        inputs: [
            { name: 'receiver', type: 'address' },
            { name: 'market', type: 'address' },
            { name: 'netSyDesired', type: 'uint256' },
            { name: 'netPtDesired', type: 'uint256' },
            { name: 'minLpOut', type: 'uint256' }
        ],
        name: 'addLiquidityDualSyAndPt',
        outputs: [
            { name: 'netLpOut', type: 'uint256' },
            { name: 'netSyUsed', type: 'uint256' },
            { name: 'netPtUsed', type: 'uint256' }
        ],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            { name: 'receiver', type: 'address' },
            { name: 'market', type: 'address' },
            { name: 'netPtIn', type: 'uint256' },
            { name: 'minLpOut', type: 'uint256' },
            {
                components: [
                    { name: 'guessMin', type: 'uint256' },
                    { name: 'guessMax', type: 'uint256' },
                    { name: 'guessOffchain', type: 'uint256' },
                    { name: 'maxIteration', type: 'uint256' },
                    { name: 'eps', type: 'uint256' }
                ],
                name: 'guessPtSwapToSy',
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
        name: 'addLiquiditySinglePt',
        outputs: [
            { name: 'netLpOut', type: 'uint256' },
            { name: 'netSyFee', type: 'uint256' }
        ],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            { name: 'receiver', type: 'address' },
            { name: 'market', type: 'address' },
            { name: 'minLpOut', type: 'uint256' },
            {
                components: [
                    { name: 'guessMin', type: 'uint256' },
                    { name: 'guessMax', type: 'uint256' },
                    { name: 'guessOffchain', type: 'uint256' },
                    { name: 'maxIteration', type: 'uint256' },
                    { name: 'eps', type: 'uint256' }
                ],
                name: 'guessPtReceivedFromSy',
                type: 'tuple'
            },
            {
                components: [
                    { name: 'tokenIn', type: 'address' },
                    { name: 'netTokenIn', type: 'uint256' },
                    { name: 'tokenMintSy', type: 'address' },
                    { name: 'bulk', type: 'bool' }
                ],
                name: 'input',
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
        name: 'addLiquiditySingleToken',
        outputs: [
            { name: 'netLpOut', type: 'uint256' },
            { name: 'netSyFee', type: 'uint256' },
            { name: 'netSyInterm', type: 'uint256' }
        ],
        stateMutability: 'payable',
        type: 'function'
    },
    {
        inputs: [
            { name: 'receiver', type: 'address' },
            { name: 'market', type: 'address' },
            { name: 'netSyIn', type: 'uint256' },
            { name: 'minLpOut', type: 'uint256' },
            {
                components: [
                    { name: 'guessMin', type: 'uint256' },
                    { name: 'guessMax', type: 'uint256' },
                    { name: 'guessOffchain', type: 'uint256' },
                    { name: 'maxIteration', type: 'uint256' },
                    { name: 'eps', type: 'uint256' }
                ],
                name: 'guessPtReceivedFromSy',
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
        name: 'addLiquiditySingleSy',
        outputs: [
            { name: 'netLpOut', type: 'uint256' },
            { name: 'netSyFee', type: 'uint256' }
        ],
        stateMutability: 'nonpayable',
        type: 'function'
    }
] as const;

export const yieldTokenAbi = [
    {
        inputs: [
            { name: 'receiverPT', type: 'address' },
            { name: 'receiverYT', type: 'address' }
        ],
        name: 'mintPY',
        outputs: [{ name: 'amountPYOut', type: 'uint256' }],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [{ name: 'receiver', type: 'address' }],
        name: 'redeemPY',
        outputs: [{ name: 'amountSyOut', type: 'uint256' }],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            { name: 'receivers', type: 'address[]' },
            { name: 'amountPYToRedeems', type: 'uint256[]' }
        ],
        name: 'redeemPYMulti',
        outputs: [{ name: 'amountSyOuts', type: 'uint256[]' }],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            { name: 'user', type: 'address' },
            { name: 'redeemInterest', type: 'bool' },
            { name: 'redeemRewards', type: 'bool' }
        ],
        name: 'redeemDueInterestAndRewards',
        outputs: [
            { name: 'interestOut', type: 'uint256' },
            { name: 'rewardsOut', type: 'uint256[]' }
        ],
        stateMutability: 'nonpayable',
        type: 'function'
    }
] as const;

export const standardizedYieldAbi = [
  {
    name: 'deposit',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'receiver', type: 'address' },
      { name: 'tokenIn', type: 'address' },
      { name: 'amountTokenToDeposit', type: 'uint256' },
      { name: 'minSharesOut', type: 'uint256' }
    ],
    outputs: [{ name: 'amountSharesOut', type: 'uint256' }]
  },
  {
    name: 'redeem',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'receiver', type: 'address' },
      { name: 'amountSharesToRedeem', type: 'uint256' },
      { name: 'tokenOut', type: 'address' },
      { name: 'minTokenOut', type: 'uint256' },
      { name: 'burnFromInternalBalance', type: 'bool' }
    ],
    outputs: [{ name: 'amountTokenOut', type: 'uint256' }]
  },
  {
    name: 'exchangeRate',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: 'res', type: 'uint256' }]
  },
  {
    name: 'claimRewards',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: 'rewardAmounts', type: 'uint256[]' }]
  },
  {
    name: 'accruedRewards',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: 'rewardAmounts', type: 'uint256[]' }]
  },
  {
    name: 'getRewardTokens',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address[]' }]
  },
  {
    name: 'yieldToken',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }]
  },
  {
    name: 'getTokensIn',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: 'res', type: 'address[]' }]
  },
  {
    name: 'getTokensOut',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: 'res', type: 'address[]' }]
  },
  {
    name: 'isValidTokenIn',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'token', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }]
  },
  {
    name: 'isValidTokenOut',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'token', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }]
  },
  {
    name: 'previewDeposit',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'tokenIn', type: 'address' },
      { name: 'amountTokenToDeposit', type: 'uint256' }
    ],
    outputs: [{ name: 'amountSharesOut', type: 'uint256' }]
  },
  {
    name: 'previewRedeem',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'tokenOut', type: 'address' },
      { name: 'amountSharesToRedeem', type: 'uint256' }
    ],
    outputs: [{ name: 'amountTokenOut', type: 'uint256' }]
  }
] as const; 
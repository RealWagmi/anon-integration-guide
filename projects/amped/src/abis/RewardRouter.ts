import { Abi } from 'viem';

export const RewardRouter = [
  {
    inputs: [
      { name: '_token', type: 'address' },
      { name: '_amount', type: 'uint256' },
      { name: '_minUsdg', type: 'uint256' },
      { name: '_minGlp', type: 'uint256' }
    ],
    name: 'mintAndStakeGlp',
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: '_minUsdg', type: 'uint256' },
      { name: '_minGlp', type: 'uint256' }
    ],
    name: 'mintAndStakeGlpETH',
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: 'payable',
    type: 'function'
  },
  {
    inputs: [
      { name: '_tokenOut', type: 'address' },
      { name: '_glpAmount', type: 'uint256' },
      { name: '_minOut', type: 'uint256' },
      { name: '_receiver', type: 'address' }
    ],
    name: 'unstakeAndRedeemGlp',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: '_glpAmount', type: 'uint256' },
      { name: '_minOut', type: 'uint256' },
      { name: '_receiver', type: 'address' }
    ],
    name: 'unstakeAndRedeemGlpETH',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "account",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "StakeGlp",
    "type": "event"
  }
] as const satisfies Abi; 
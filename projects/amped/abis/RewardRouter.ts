export const RewardRouter = [
  {
    inputs: [
      { name: '_token', type: 'address' },
      { name: '_amount', type: 'uint256' },
      { name: '_minUsdg', type: 'uint256' },
      { name: '_minGlp', type: 'uint256' }
    ],
    name: 'mintAndStakeGlp',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: '_minUsdg', type: 'uint256' },
      { name: '_minGlp', type: 'uint256' }
    ],
    name: 'mintAndStakeGlpETH',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'payable',
    type: 'function'
  }
] as const; 
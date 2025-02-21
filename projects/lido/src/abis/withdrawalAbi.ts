const withdrawalAbi = [
  {
    inputs: [
      { internalType: "uint256[]", name: "_amounts", type: "uint256[]" },
      { internalType: "address", name: "_owner", type: "address" },
    ],
    name: "requestWithdrawals",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256[]", name: "_requestIds", type: "uint256[]" },
      { internalType: "uint256[]", name: "_hints", type: "uint256[]" }
    ],
    name: "claimWithdrawals",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
    notice: "Claim a batch of withdrawal requests if they are finalized sending locked ether to the owner"
  },
  {
    inputs: [
      { internalType: "uint256[]", name: "_requestIds", type: "uint256[]" }
    ],
    name: "getWithdrawalStatus",
    outputs: [
      { internalType: "bool[]", name: "statuses", type: "bool[]" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256[]", name: "_requestIds", type: "uint256[]" },
      { internalType: "uint256[]", name: "_hints", type: "uint256[]" }
    ],
    name: "getClaimableEther",
    outputs: [
      { internalType: "uint256[]", name: "amounts", type: "uint256[]" }
    ],
    stateMutability: "view",
    type: "function"
  }
];

export default withdrawalAbi;
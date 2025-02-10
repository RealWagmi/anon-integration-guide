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
      { internalType: "address", name: "_receiver", type: "address" },
    ],
    name: "claimWithdrawals",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_requestId", type: "uint256" }
    ],
    name: "getWithdrawalStatus",
    outputs: [
      { internalType: "bool", name: "isProcessed", type: "bool" }
    ],
    stateMutability: "view",
    type: "function"
  },
];

export default withdrawalAbi;

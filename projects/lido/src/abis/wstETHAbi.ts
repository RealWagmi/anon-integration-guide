const wstETHAbi = [
  {
    inputs: [{ internalType: "uint256", name: "_stETHAmount", type: "uint256" }],
    name: "wrap",
    outputs: [{ internalType: "uint256", name: "wstETHAmount", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_wstETHAmount", type: "uint256" }],
    name: "unwrap",
    outputs: [{ internalType: "uint256", name: "stETHAmount", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_wstETHAmount", type: "uint256" }],
    name: "getStETHByWstETH",
    outputs: [{ internalType: "uint256", name: "stETHAmount", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_stETHAmount", type: "uint256" }],
    name: "getWstETHByStETH",
    outputs: [{ internalType: "uint256", name: "wstETHAmount", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "stETH",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "balance", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
];

export default wstETHAbi;

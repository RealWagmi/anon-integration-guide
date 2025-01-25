export const VaultPriceFeed = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_token",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "_maximise",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "_includeAmmPrice",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "_useSwapPricing",
        "type": "bool"
      }
    ],
    "name": "getPrice",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const; 
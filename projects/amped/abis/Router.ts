export const Router = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_plugin",
        "type": "address"
      }
    ],
    "name": "approvePlugin",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "approvedPlugins",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address[]",
        "name": "_path",
        "type": "address[]"
      },
      {
        "internalType": "address",
        "name": "_indexToken",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_minOut",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_sizeDelta",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "_isLong",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "_acceptablePrice",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_executionFee",
        "type": "uint256"
      },
      {
        "internalType": "bytes32",
        "name": "_referralCode",
        "type": "bytes32"
      },
      {
        "internalType": "address",
        "name": "_callbackTarget",
        "type": "address"
      }
    ],
    "name": "createIncreasePositionETH",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_tokenIn",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_tokenOut",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_amountIn",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_minOut",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "_receiver",
        "type": "address"
      }
    ],
    "name": "swap",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_tokenIn",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_tokenOut",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_amountIn",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_minOut",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_triggerPrice",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "_triggerAboveThreshold",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "_executionFee",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "_shouldWrap",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "_shouldUnwrap",
        "type": "bool"
      }
    ],
    "name": "createSwapOrder",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  }
]; 
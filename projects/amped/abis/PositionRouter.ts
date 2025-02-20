import { Abi } from 'viem';

export const PositionRouter = [
  {
    "inputs": [],
    "name": "minExecutionFee",
    "outputs": [
      {
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "name": "_path",
        "type": "address[]"
      },
      {
        "name": "_indexToken",
        "type": "address"
      },
      {
        "name": "_amountIn",
        "type": "uint256"
      },
      {
        "name": "_minOut",
        "type": "uint256"
      },
      {
        "name": "_sizeDelta",
        "type": "uint256"
      },
      {
        "name": "_isLong",
        "type": "bool"
      },
      {
        "name": "_acceptablePrice",
        "type": "uint256"
      },
      {
        "name": "_executionFee",
        "type": "uint256"
      },
      {
        "name": "_referralCode",
        "type": "bytes32"
      },
      {
        "name": "_callbackTarget",
        "type": "address"
      }
    ],
    "name": "createIncreasePosition",
    "outputs": [
      {
        "type": "bytes32"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "name": "_path",
        "type": "address[]"
      },
      {
        "name": "_indexToken",
        "type": "address"
      },
      {
        "name": "_collateralDelta",
        "type": "uint256"
      },
      {
        "name": "_sizeDelta",
        "type": "uint256"
      },
      {
        "name": "_isLong",
        "type": "bool"
      },
      {
        "name": "_receiver",
        "type": "address"
      },
      {
        "name": "_acceptablePrice",
        "type": "uint256"
      },
      {
        "name": "_minOut",
        "type": "uint256"
      },
      {
        "name": "_executionFee",
        "type": "uint256"
      },
      {
        "name": "_withdrawETH",
        "type": "bool"
      },
      {
        "name": "_callbackTarget",
        "type": "address"
      }
    ],
    "name": "createDecreasePosition",
    "outputs": [
      {
        "type": "bytes32"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "name": "_path",
        "type": "address[]"
      },
      {
        "name": "_sizeDelta",
        "type": "uint256"
      },
      {
        "name": "_collateralToken",
        "type": "address"
      },
      {
        "name": "_collateralDelta",
        "type": "uint256"
      },
      {
        "name": "_isLong",
        "type": "bool"
      },
      {
        "name": "_receiver",
        "type": "address"
      },
      {
        "name": "_acceptablePrice",
        "type": "uint256"
      },
      {
        "name": "_executionFee",
        "type": "uint256"
      },
      {
        "name": "_callbackTarget",
        "type": "address"
      }
    ],
    "name": "createDecreasePositionETH",
    "outputs": [
      {
        "type": "bytes32"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  }
] as const satisfies Abi; 
export var PositionRouter = [
    {
        "inputs": [],
        "name": "minExecutionFee",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
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
        "name": "createIncreasePosition",
        "outputs": [
            {
                "internalType": "bytes32",
                "name": "",
                "type": "bytes32"
            }
        ],
        "stateMutability": "payable",
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
        "outputs": [
            {
                "internalType": "bytes32",
                "name": "",
                "type": "bytes32"
            }
        ],
        "stateMutability": "payable",
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
                "name": "_collateralDelta",
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
                "internalType": "address",
                "name": "_receiver",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "_acceptablePrice",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "_minOut",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "_executionFee",
                "type": "uint256"
            },
            {
                "internalType": "bool",
                "name": "_withdrawETH",
                "type": "bool"
            }
        ],
        "name": "createDecreasePosition",
        "outputs": [
            {
                "internalType": "bytes32",
                "name": "",
                "type": "bytes32"
            }
        ],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "_key",
                "type": "bytes32"
            }
        ],
        "name": "getRequestQueueLengths",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];

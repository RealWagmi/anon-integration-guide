export const HYPERSONIC_ROUTER_ABI = [
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_weth",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "_executor",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "_initMPSF",
                "type": "uint256"
            },
            {
                "internalType": "uint64",
                "name": "_initMRF",
                "type": "uint64"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "inputs": [
            {
                "internalType": "uint64",
                "name": "fee",
                "type": "uint64"
            },
            {
                "internalType": "uint64",
                "name": "MAX_REFERRAL_FEE",
                "type": "uint64"
            }
        ],
        "name": "FeeTooHigh",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "output",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "min_output",
                "type": "uint256"
            }
        ],
        "name": "InsufficientOutput",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "InvalidExecutor",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "NativeTransferFailed",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "NoActiveReferral",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "token",
                "type": "address"
            }
        ],
        "name": "SameToken",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "sender",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "owner",
                "type": "address"
            }
        ],
        "name": "Unauthorized",
        "type": "error"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "address",
                "name": "new_executor",
                "type": "address"
            }
        ],
        "name": "ExecutorUpdated",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "previousOwner",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "newOwner",
                "type": "address"
            }
        ],
        "name": "OwnershipTransferred",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint32",
                "name": "referral_code",
                "type": "uint32"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "beneficiary",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "address",
                "name": "out_token",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "fee_amount",
                "type": "uint256"
            }
        ],
        "name": "ReferralFeePaid",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "beneficiary",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "uint32",
                "name": "referral_code",
                "type": "uint32"
            },
            {
                "indexed": false,
                "internalType": "uint64",
                "name": "referral_fee",
                "type": "uint64"
            }
        ],
        "name": "ReferralRegistered",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "beneficiary",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "uint32",
                "name": "referral_code",
                "type": "uint32"
            },
            {
                "indexed": false,
                "internalType": "uint64",
                "name": "new_referral_fee",
                "type": "uint64"
            }
        ],
        "name": "ReferralUpdated",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "user",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "address",
                "name": "in_token",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "address",
                "name": "out_token",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "in_amount",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "out_amount",
                "type": "uint256"
            }
        ],
        "name": "Swap",
        "type": "event"
    },
    {
        "inputs": [],
        "name": "HYPERSONIC_EXECUTOR",
        "outputs": [
            {
                "internalType": "contract IHYPERSONICEXECUTOR",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "MAX_POS_SLIPPAGE_FEE",
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
        "inputs": [],
        "name": "MAX_REFERRAL_FEE",
        "outputs": [
            {
                "internalType": "uint64",
                "name": "",
                "type": "uint64"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "TOTAL_REF",
        "outputs": [
            {
                "internalType": "uint32",
                "name": "",
                "type": "uint32"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "WETH",
        "outputs": [
            {
                "internalType": "contract IWETH",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "idx",
                "type": "uint256"
            },
            {
                "internalType": "address",
                "name": "addr",
                "type": "address"
            }
        ],
        "name": "add_CACHE",
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
            }
        ],
        "name": "beneficiary_code",
        "outputs": [
            {
                "internalType": "uint32",
                "name": "",
                "type": "uint32"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256[]",
                "name": "idxs",
                "type": "uint256[]"
            },
            {
                "internalType": "address[]",
                "name": "addrs",
                "type": "address[]"
            }
        ],
        "name": "bulk_CACHE",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "eth_withdraw",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "index",
                "type": "uint256"
            }
        ],
        "name": "get_from_cache",
        "outputs": [
            {
                "internalType": "address",
                "name": "result",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes",
                "name": "info",
                "type": "bytes"
            },
            {
                "internalType": "bytes",
                "name": "path",
                "type": "bytes"
            }
        ],
        "name": "hyperswap",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address[]",
                "name": "tokens",
                "type": "address[]"
            }
        ],
        "name": "m_withdraw",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "owner",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint32",
                "name": "",
                "type": "uint32"
            }
        ],
        "name": "referral_lookup",
        "outputs": [
            {
                "internalType": "uint64",
                "name": "referral_fee",
                "type": "uint64"
            },
            {
                "internalType": "address",
                "name": "beneficiary",
                "type": "address"
            },
            {
                "internalType": "bool",
                "name": "registered",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint64",
                "name": "referral_fee",
                "type": "uint64"
            }
        ],
        "name": "register_ref_code",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "renounceOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "token",
                "type": "address"
            }
        ],
        "name": "s_withdraw",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_executor",
                "type": "address"
            }
        ],
        "name": "set_EXEC",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_MPSF",
                "type": "uint256"
            }
        ],
        "name": "set_MPSF",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint64",
                "name": "_MRF",
                "type": "uint64"
            }
        ],
        "name": "set_MRF",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "newOwner",
                "type": "address"
            }
        ],
        "name": "transferOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "unwrapETH",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "wrapETH",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "stateMutability": "payable",
        "type": "receive"
    }
] as const
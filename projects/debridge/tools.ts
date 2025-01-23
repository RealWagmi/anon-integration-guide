import { AiTool } from '@heyanon/sdk';

export const tools: AiTool[] = [
    {
        name: 'getSupportedChains',
        description: 'Get a list of all chains supported by the DeBridge protocol, including their chain IDs and names.',
        required: [], // No required parameters
        props: [], // No props needed
    },
    {
        name: 'getTokenInfo',
        description: 'Get token information from a chain. For EVM chains use 0x-prefixed address, for Solana use base58 token address.',
        required: ['chainId'],
        props: [
            {
                name: 'chainId',
                type: 'string',
                description: 'Chain ID to get token information for',
            },
            {
                name: 'tokenAddress',
                type: 'string',
                description: 'Optional specific token address to query information for',
                required: false,
            },
            {
                name: 'search',
                type: 'string',
                description: 'Optional search term to filter tokens by name or symbol',
                required: false,
            },
        ],
    },
    {
        name: 'getBridgeQuote',
        description: 'Get a quote for bridging tokens between chains. Use getTokenInfo first to get correct token addresses.',
        required: ['srcChainId', 'srcChainTokenIn', 'srcChainTokenInAmount', 'dstChainId', 'dstChainTokenOut', 'account'],
        props: [
            {
                name: 'srcChainId',
                type: 'string',
                description: 'Source chain ID (e.g., "1" for Ethereum)',
            },
            {
                name: 'srcChainTokenIn',
                type: 'string',
                description: 'Token address on source chain (0x0 for native token)',
            },
            {
                name: 'srcChainTokenInAmount',
                type: 'string',
                description: 'Amount in base units (e.g., wei)',
            },
            {
                name: 'dstChainId',
                type: 'string',
                description: 'Destination chain ID',
            },
            {
                name: 'dstChainTokenOut',
                type: 'string',
                description: 'Token address on destination chain',
            },
            {
                name: 'account',
                type: 'string',
                description: 'User wallet address',
            },
            {
                name: 'slippage',
                type: 'string',
                description: 'Optional slippage percentage (0-100)',
                required: false,
            },
            {
                name: 'prependOperatingExpenses',
                type: 'boolean',
                description: 'Whether to include operating expenses',
                required: false,
            },
        ],
    },
    {
        name: 'createBridgeOrder',
        description: `Create a bridge order to transfer tokens between chains.

Special considerations for different chains:

EVM to EVM:
- Set dstChainTokenOutRecipient to recipient's EVM address
- Set dstChainTokenOut to the erc-20 format address

To Solana (7565164):
- dstChainTokenOutRecipient should be Solana address (base58)
- dstChainTokenOut should be Solana token mint address (base58)

From Solana:
- dstChainTokenOutRecipient should be EVM address
- dstChainTokenOut should be ERC-20 format address`,
        required: ['srcChainId', 'srcChainTokenIn', 'srcChainTokenInAmount', 'dstChainId', 'dstChainTokenOut', 'dstChainTokenOutRecipient', 'account'],
        props: [
            {
                name: 'srcChainId',
                type: 'string',
                description: 'Source chain ID (e.g., "1" for Ethereum)',
            },
            {
                name: 'srcChainTokenIn',
                type: 'string',
                description: 'Token address on source chain (0x0 for native token)',
            },
            {
                name: 'srcChainTokenInAmount',
                type: 'string',
                description: 'Amount in base units (e.g., wei)',
            },
            {
                name: 'dstChainId',
                type: 'string',
                description: 'Destination chain ID',
            },
            {
                name: 'dstChainTokenOut',
                type: 'string',
                description: 'Token address on destination chain',
            },
            {
                name: 'dstChainTokenOutRecipient',
                type: 'string',
                description: 'Recipient address on destination chain',
            },
            {
                name: 'account',
                type: 'string',
                description: 'User wallet address (sender)',
            },
        ],
    },
    {
        name: 'executeBridgeTransaction',
        description: 'Execute a bridge transaction on the blockchain. This function takes the transaction data from createBridgeOrder and executes it.',
        required: ['chainId', 'account', 'transactionData'],
        props: [
            {
                name: 'chainId',
                type: 'string',
                description: 'Chain ID where the transaction will be executed',
            },
            {
                name: 'account',
                type: 'string',
                description: 'User wallet address',
            },
            {
                name: 'transactionData',
                type: 'object',
                description: 'Transaction data from createBridgeOrder',
                properties: {
                    target: {
                        type: 'string',
                        description: 'Contract address to call',
                    },
                    data: {
                        type: 'string',
                        description: 'Encoded transaction data',
                    },
                    value: {
                        type: 'string',
                        description: 'Amount of native tokens to send',
                        required: false,
                    },
                },
            },
        ],
    },
    {
        name: 'checkTransactionStatus',
        description: `Check the status of a bridge transaction.

Status meanings:
- None: Order not found or invalid
- Created: Order created but not yet processed
- Fulfilled: Order has been processed and tokens are being transferred
- SentUnlock: Tokens have been unlocked on the destination chain
- OrderCancelled: Order was cancelled by the user or system
- SentOrderCancel: Cancellation request has been sent
- ClaimedUnlock: Tokens have been claimed by the recipient
- ClaimedOrderCancel: Cancellation has been completed and tokens returned`,
        required: ['orderId'],
        props: [
            {
                name: 'orderId',
                type: 'string',
                description: 'ID of the order to check',
            },
        ],
    },
];

#!/bin/bash

# Check arguments
if [ "$#" -ne 3 ]; then
    echo "Usage: ./create-module.sh <module-name> \"<description>\" \"<chains>\""
    echo "Example: ./create-module.sh example-protocol \"Integration with Example Protocol\" \"ETHEREUM,ARBITRUM\""
    exit 1
fi

MODULE_NAME=$1
DESCRIPTION=$2
CHAINS=$3

# Path to the projects directory
BASE_PATH="../projects/$MODULE_NAME"

# Create directories
echo "Creating directories..."
mkdir -p "$BASE_PATH"/{abis,functions}

# Create .gitignore

echo "Creating .gitignore..."
cat > "$BASE_PATH/.gitignore" << EOF
node_modules
EOF

# Create package.json
echo "Creating package.json..."
cat > "$BASE_PATH/package.json" << EOF
{
    "name": "@projects/${MODULE_NAME}",
    "version": "1.0.0",
    "scripts": {
        "yarn": "yarn install"
    },
    "dependencies": {
        "@heyanon/sdk": "^1.0.4"
    },
    "license": "MIT",
    "engines": {
        "npm": "please-use-yarn",
        "node": ">=18.x",
        "yarn": ">=1.22"
    }
}
EOF

# Create constants.ts
echo "Creating constants.ts..."
cat > "$BASE_PATH/constants.ts" << EOF
import { ChainId } from '@heyanon/sdk';

export const supportedChains = [$(echo $CHAINS | sed 's/,/, /g' | sed 's/\([A-Z,]*\)/ChainId.\1/g')];
EOF

# Create index.ts
echo "Creating index.ts..."
cat > "$BASE_PATH/index.ts" << EOF
import { AdapterExport } from '@heyanon/sdk'';
import { tools } from './tools';
import * as functions from './functions';

export default {
    tools,
    functions,
    description: '${DESCRIPTION}',
} satisfies AdapterExport;
EOF

# Create tools.ts
echo "Creating tools.ts..."
cat > "$BASE_PATH/tools.ts" << EOF
import { AiTool, getChainName } from '@heyanon/sdk';
import { supportedChains } from './constants';

export const tools: AiTool[] = [
    {
        name: 'example',
        description: 'Example function that demonstrates how to interact with the protocol. It shows basic transaction flow, including checking balances, preparing transaction data, and handling approvals if needed.',
        required: ['chainName', 'account', 'amount'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to execute the example',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will execute the example',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'Amount of tokens for the example in decimal format',
            },
        ],
    },
];
EOF

# Create functions/index.ts
echo "Creating functions/index.ts..."
cat > "$BASE_PATH/functions/index.ts" << EOF
export { example } from './example';
EOF

# Create README.md
echo "Creating README.md..."
cat > "$BASE_PATH/README.md" << EOF
# ${MODULE_NAME}

${DESCRIPTION}

## Supported Networks

$(echo $CHAINS | tr "," "\n" | sed 's/^/- /')

## Common Tasks

1. Basic Operations
   - "Execute example operation with 100 USDT in @${MODULE_NAME} on Ethereum network"
   - "Run example transaction with 50 USDC in @${MODULE_NAME}"
   - "Perform example action with 1000 tokens in @${MODULE_NAME}"

2. Information Queries
   - "Show my current status in @${MODULE_NAME}"
   - "Check my balance in @${MODULE_NAME}"
   - "Get example statistics from @${MODULE_NAME}"
   - "Calculate expected results for my position in @${MODULE_NAME}"


## Available Functions

List of available functions will be added here.

## Installation

\`\`\`bash
yarn add @heyanon/${MODULE_NAME}
\`\`\`

## Usage

Example usage will be added here.
EOF

# Create functions/example.ts
echo "Creating functions/example.ts..."
cat > "$BASE_PATH/functions/example.ts" << EOF
import { Address, parseUnits } from 'viem';
import { FunctionReturn, FunctionOptions, TransactionParams, toResult, getChainFromName, checkToApprove } from '@heyanon/sdk';
import { supportedChains } from '../constants';

interface Props {
    chainName: string;
    account: Address;
    amount: string;
}

/**
 * Example function that demonstrates protocol interaction pattern.
 * @param props - The function parameters
 * @param tools - System tools for blockchain interactions
 * @returns Transaction result
 */
export async function example({ chainName, account, amount }: Props, { sendTransactions, notify }: FunctionOptions): Promise<FunctionReturn> {
    // Check wallet connection
    if (!account) return toResult('Wallet not connected', true);

    // Validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(\`Unsupported chain name: \${chainName}\`, true);
    if (!supportedChains.includes(chainId)) return toResult(\`Protocol is not supported on \${chainName}\`, true);

    // Validate amount
    const amountInWei = parseUnits(amount, 18);
    if (amountInWei === 0n) return toResult('Amount must be greater than 0', true);

    await notify('Preparing example transaction...');

    const transactions: TransactionParams[] = [];

    // Example transaction
    const tx: TransactionParams = {
        target: '0x...',  // Protocol contract address
        data: '0x...',    // Encoded function call
    };
    transactions.push(tx);

    await notify('Waiting for transaction confirmation...');

    // Sign and send transaction
    const result = await sendTransactions({ chainId, account, transactions });
    const message = result.data[result.data.length - 1];

    return toResult(result.isMultisig ? message.message : \`Successfully executed example with \${amount} tokens. \${message.message}\`);
}
EOF

# Create .prettierrc
echo "Creating .prettierrc..."
cat > "$BASE_PATH/.prettierrc" << EOF
{
    "singleQuote": true,
    "trailingComma": "all",
    "tabWidth": 4,
    "printWidth": 180
}
EOF

echo "Module ${MODULE_NAME} created successfully!"
echo "Next steps:"
echo "1. cd ${BASE_PATH}"
echo "2. Add your contract ABIs to the abis/ directory"
echo "3. Implement your functions in the functions/ directory"
echo "4. Update tools.ts with your function configurations"
echo "5. Update README.md with specific usage examples"
echo "6. Add your module to the projects/ directory"
echo "7. Update index.ts in the projects/ directory"

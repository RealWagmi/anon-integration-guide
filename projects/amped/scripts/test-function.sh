#!/bin/bash

# Test a function using the direct function call script
# Usage: ./test-function.sh <function_name> [params...]

if [ $# -eq 0 ]; then
    echo "Usage: $0 <function_name> [params...]"
    echo "Example: $0 getPoolLiquidity chainName=sonic"
    exit 1
fi

cd "$(dirname "$0")/.."

# Set up environment
export NODE_ENV=development

# Check if .env exists
if [ ! -f .env ]; then
    echo "Error: .env file not found"
    echo "Please create a .env file with your PRIVATE_KEY"
    exit 1
fi

# Run the function
echo "Testing function: $1"
echo "Parameters: ${@:2}"
echo "---"

# Use npx to run tsx without relying on local installation
npx tsx scripts/direct-function-call.ts "$@"
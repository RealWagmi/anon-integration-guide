# HeyAnon AI Module Development Documentation

Welcome to the technical documentation for developing additional project modules for the HeyAnon AI Chatbot.

[Fast track terms](./guides/fast-track-terms.md)

## Contents

- [Introduction](./guides/introduction.md)
- [Requirements](./guides/requirements.md)
- [Architecture and Design](./guides/architecture-and-design.md)
- [Action Functions Implementation Guide](./guides/action-functions.md)
- [Getter Functions Implementation Guide](./guides/getter-functions.md)
- [Tools Implementation Guide](./guides/tools-implementation.md)
- [Module README Guidelines](./guides/module-readme-guidelines.md)
- [Conclusion](./guides/conclusion.md)
- [Additional Resources](./guides/additional-resources.md)

## Quick Links

- [Action Function Example](./guides/action-function-example.md)
- [Getter Function Example](./guides/getter-function-example.md)

## Quick Start

To create a new module, use the provided bash script:

```bash
cd scripts
chmod +x create-module.sh
./create-module.sh <module-name> "<description>" "<chains>"
```

Parameters:

- `module-name`: Name of your module (e.g., "example-protocol")
- `description`: Short description of your module in quotes
- `chains`: Comma-separated list of supported chains in quotes (e.g., "ETHEREUM,ARBITRUM")

Example:

```bash
./create-module.sh example-protocol "Integration with Example Protocol" "ETHEREUM,ARBITRUM"
cd projects/example-protocol
yarn install
```

The script will create:

1. Module directory structure in [projects](./projects) folder:
   - `abis/` - for contract ABIs
   - `functions/` - for action and getter functions
   - Configuration files (index.ts, tools.ts, etc.)
2. Basic README.md with template documentation
3. Git repository initialization
4. Package.json with correct naming

After creation, follow the printed instructions to complete module setup.

## Contribution Guide

### Module Structure

All modules must be placed in the [projects](./projects) directory. This ensures consistent organization and easier maintenance of the codebase.

### Development Process

1. Fork the repository
2. Create a new branch for your module:
   ```bash
   git checkout -b feature/module-name
   ```
3. Create your module using the provided script
4. Implement required functionality following the guides
5. Test your implementation thoroughly
6. Create documentation for your module

### Pull Request Process

1. Ensure your code follows the project's coding standards
2. Update the documentation as needed
3. Create a Pull Request with:
   - Clear description of the module's functionality
   - List of supported chains
   - Any special configuration requirements
   - Test results or coverage reports
4. Wait for review from maintainers

### Code Standards

- Use TypeScript for all implementations
- Follow existing code style and formatting
- Include proper error handling
- Add comprehensive comments
- Ensure type safety

### Testing

- Test all functions with different input scenarios
- Verify error handling
- Test on all supported networks

## Supported Networks

[Available networks for integration:](https://github.com/RealWagmi/heyanon-sdk/blob/main/src/blockchain/constants/chains.ts)

### Mainnet Networks

- ETHEREUM (Ethereum Mainnet, 1)
- BSC (BNB Smart Chain, 56)
- KAVA (Kava EVM, 2222)
- BASE (Base, 8453)
- IOTA (IOTA EVM, 1074)
- AVALANCHE (Avalanche C-Chain, 43114)
- ARBITRUM (Arbitrum One, 42161)
- SONIC (Sonic, 146)

### Testnet Networks

- SEPOLIA (Ethereum Testnet Sepolia, 11155111)
- ONE_SEPOLIA (Arbitrum Sepolia Testnet, 421614)

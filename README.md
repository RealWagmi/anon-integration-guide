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

The fastest way to create a new project is using our setup script:

```bash
node scripts/create-module.js project-name "Project description"
```

For example:
```bash
node scripts/create-module.js uniswap-v3 "Uniswap V3 DEX integration"
```

After running the script:
1. Navigate to your new project directory
2. Install dependencies and build:
## If you don't have pnpm installed globally, install it first:
### Option 1 (requires admin privileges):
npm install -g pnpm
```bash
cd projects/project-name
pnpm install
pnpm run build
```

## Manual Project Integration

If you prefer to set up your project manually, follow these steps:

1. Create a new project folder in the `projects` directory:
```bash
cd projects
mkdir project-name
```
2. Copy the skeleton project files:
```bash
# On Unix-like systems (Linux/MacOS)
cp -r skeleton/* project-name/

# On Windows (Command Prompt)
xcopy skeleton project-name /E /I /H

# On Windows (PowerShell)
Copy-Item -Path "skeleton\*" -Destination "project-name" -Recurse
```

3. Update the project configuration:
   - Open `project-name/package.json`
   - Change the name from `"@heyanon/project-skeleton"` to `"@heyanon/project-your_project`
   - Update description and other relevant fields

4. Install dependencies and build:
```bash
cd project-name
pnpm install
pnpm run build
```
## Project Structure

The skeleton project provides:

1. Standard directory structure:
   - `src/` - main source code directory
   - `src/abis/` - for contract ABIs
   - `src/functions/` - for action and getter functions
   - Configuration files (index.ts, constants.ts, etc.)
2. Basic README.md template
3. Build configuration
4. Package.json with correct structure

## Next Steps

After setting up your project (either way), follow these steps:
1. Add your contract ABIs to `src/abis/`
2. Implement your functions in `src/functions/`
3. Update constants and tools in respective files
4. Update README.md with project-specific documentation
5. Test your implementation
6. Build the project using `pnpm run build`

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
# Special requirements
1. Do not use recipient in your functions. It's forbidden due security concerns for now.
2. Quantity of arguments in you function must match with arguments in your tools. You can't omit optional arguments. See examples for this cases in Venus project, repay function.
3. If you want to create an interaction involving staking a token with the symbol 'SOME', you should add the address of this token to the constants file and continue writing the necessary functions. However, when your project is merged into Anon, there might be issues because the token symbol 'SOME' is not included in our token list (https://github.com/RealWagmi/heyanon-tokenlist). Therefore, you need to add it to the token list as well. This does not apply to tokens that are not involved in user inputs and are used only as constants within your project.
4. Do not use bigint as argument for functions which invoke AI via tools. Only number, strings, arrays, etc. But not bigints.
5. You must understand that we are developing our product for everyone. Please create a comprehensive description of the protocol and explain how it works without using technical jargon or ambiguity. Include this description in a get function that Anon can invoke to explain the protocol flow to the user in chat.
6. If you need put info in .env => You create in root project not .env, but env.ts near index.ts.
There for example
   ```
   export const TEST_ENV = process.env.TEST_ENV
   ```
We edit our env.  and add your TEST_ENV. And in your Readme, please write that the project supports such env 

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



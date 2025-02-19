const fs = require('fs');
const path = require('path');

// Get command line arguments
const args = process.argv.slice(2);
if (args.length !== 2) {
    console.log('Usage: node create-module.js <project-name> "<description>"');
    console.log('Example: node create-module.js uniswap "Uniswap V3 Integration"');
    process.exit(1);
}

const [projectName, description] = args;

// Update paths to use projects directory instead of packages
const basePath = path.join(__dirname, '..', 'projects', projectName);
const skeletonPath = path.join(__dirname, '..', 'projects', 'skeleton');

// Check if skeleton directory exists
if (!fs.existsSync(skeletonPath)) {
    console.error(`Error: Skeleton directory not found at ${skeletonPath}`);
    console.error('Please ensure the skeleton project exists in the projects directory');
    process.exit(1);
}

// Create project directory
console.log('Creating project directory...');
fs.mkdirSync(basePath, { recursive: true });

// Copy skeleton files
console.log('Copying skeleton files...');
function copyDir(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}
copyDir(skeletonPath, basePath);

// Update package.json
console.log('Updating package.json...');
const packageJsonPath = path.join(basePath, 'package.json');
let packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
packageJson.name = `@heyanon/project-${projectName}`;
packageJson.description = description;
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

// Create README.md
console.log('Updating README.md...');
const readmeContent = `# ${projectName}

${description}

## Installation

\`\`\`bash
pnpm add @heyanon/${projectName}
\`\`\`

## Supported Functions

List of available functions will be added here.

## Usage

Example usage will be added here.

## Development

1. Install dependencies:
\`\`\`bash
pnpm install
\`\`\`

2. Build the project:
\`\`\`bash
pnpm run build
\`\`\`

3. Run tests:
\`\`\`bash
pnpm test
\`\`\`

## Documentation

Detailed documentation will be added here.
`;

fs.writeFileSync(path.join(basePath, 'README.md'), readmeContent);

console.log(`Project ${projectName} created successfully!`);
console.log('Next steps:');
console.log(`1. cd ${basePath}`);
console.log('2. Add your contract ABIs to src/abis/');
console.log('3. Implement your functions in src/functions/');
console.log('4. Update src/constants.ts with supported chains');
console.log('5. Update src/tools.ts with your function configurations');
console.log('6. Update README.md with specific usage examples');
console.log('7. Build your project with: pnpm run build'); 
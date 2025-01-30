// eslint.config.js
const typescript = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');

module.exports = [
    {
        files: ['**/*.ts'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
            },
        },
        plugins: {
            '@typescript-eslint': typescript,
        },
        rules: {
            quotes: ['error', 'single'],
            '@typescript-eslint/no-explicit-any': 'error',
            semi: ['error', 'always'],
            indent: ['error', 4],
        },
    },
];

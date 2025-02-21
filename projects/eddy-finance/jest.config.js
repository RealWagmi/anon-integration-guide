module.exports = {
    testEnvironment: 'node',
    roots: ['<rootDir>/test'],
    moduleFileExtensions: ['ts', 'js'],
    transform: {
        '^.+\\.ts$': 'ts-jest',
    },
    testMatch: ['**/?(*.)+(spec|test).[tj]s?(x)'],
};

import { ChainId } from '@heyanon/sdk';

/**
 * Global list of supported blockchain networks across all modules
 */
export const supportedChains = [
    ChainId.SONIC, // 146
    // Add other supported chains as needed
];

// Constants for APR calculations
export const PRECISION = 1e30;
export const SECONDS_PER_YEAR = 31536000; // 365 * 24 * 60 * 60

// Other global constants can go here

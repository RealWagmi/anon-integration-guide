export const config = {
    rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
    // Add other configuration settings here as needed
    snapshot: {
        interval: 5 * 60 * 1000,  // 5 minutes in milliseconds
        maxHistory: 168,          // Maximum hours of history to keep (1 week)
    },
    retry: {
        maxAttempts: 3,
        delay: 1000,              // 1 second between retries
    }
} as const;
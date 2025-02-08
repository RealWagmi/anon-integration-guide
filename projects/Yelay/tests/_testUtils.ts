import { spawn } from 'child_process';

export async function setupMainnetFork(providerUrl: string) {
    const hardhatNode = spawn(
        'npx',
        ['hardhat', 'node', '--fork', `${providerUrl}`, '--fork-block-number', '21767852'],
        {
            detached: true,
            stdio: 'ignore',
        },
    );

    // Wait for Hardhat node to start
    await new Promise((resolve) => setTimeout(resolve, 5000));

    return hardhatNode;
}

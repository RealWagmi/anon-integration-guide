import { spawn } from 'child_process';
import { FunctionOptions, SendTransactionProps } from '@heyanon/sdk';
import { TransactionReturn } from '@heyanon/sdk/dist/blockchain';
import {
    impersonateAccount,
    stopImpersonatingAccount,
} from '@nomicfoundation/hardhat-network-helpers';
import { getSigner } from '@nomiclabs/hardhat-ethers/internal/helpers';
import hre from 'hardhat';

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

export const mockedFunctionOptions = {
    getProvider: jest.fn(),
    sendTransactions: jest.fn(async (props: SendTransactionProps): Promise<TransactionReturn> => {
        await impersonateAccount(props.account);

        const userSigner = await getSigner(hre, props.account);
        for (const tx of props.transactions) {
            const sentTx = await userSigner.sendTransaction({
                to: tx.target,
                data: tx.data,
            });
            await sentTx.wait();
        }

        await stopImpersonatingAccount(props.account);

        return {
            isMultisig: false,
            data: [
                {
                    message: 'mock approved',
                    hash: '0x00',
                },
            ],
        };
    }),
    notify: jest.fn(async (message: string): Promise<any> => {
        console.info(`Notification message to user: ${message}`);
    }),
} as jest.Mocked<FunctionOptions>;

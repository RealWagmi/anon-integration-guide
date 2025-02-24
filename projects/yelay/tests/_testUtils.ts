import { spawn } from 'child_process';
import { FunctionOptions, SendTransactionProps } from '@heyanon/sdk';
import { TransactionReturn } from '@heyanon/sdk/dist/blockchain';
import {
    impersonateAccount,
    setBalance,
    stopImpersonatingAccount,
} from '@nomicfoundation/hardhat-network-helpers';
import { getContractAt, getSigner } from '@nomiclabs/hardhat-ethers/internal/helpers';
import hre from 'hardhat';
import { parseUnits } from 'viem';
import ERC20 from '../src/abis/ERC20.json';

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

export async function transferUSDC(recipient: string, amount: string): Promise<void> {
    const usdcAddress = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'; // USDC token contract
    const whale = '0xCB66f5e69427b3947C62408aD8081A5047b6B3FD'; // USDC-rich account
    const amountInDecimals = parseUnits('1000', 6); // USDC has 6 decimals

    await fundAddressWithEth(whale);

    await impersonateAccount(whale);

    const whaleSigner = await getSigner(hre, whale);

    const usdc = await getContractAt(hre, ERC20.abi, usdcAddress, whaleSigner);

    const tx = await usdc.transfer(recipient, amountInDecimals);
    await tx.wait();

    await stopImpersonatingAccount(whale);

    console.log(`Transferred ${amount} USDC to ${recipient}`);
}

export async function fundAddressWithEth(address: string): Promise<void> {
    await setBalance(address, 100n ** 18n);
}

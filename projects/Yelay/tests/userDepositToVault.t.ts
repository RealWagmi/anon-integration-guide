import { FunctionOptions, SendTransactionProps } from '@heyanon/sdk';
import { userDepositToVault } from '../functions';
import { UserDepositToVaultProps } from '../functions/userDepositToVault';
import * as constants from '../constants';
import { config } from '../constants';
import { spawn, ChildProcess } from 'child_process';
import { TransactionReturn } from '@heyanon/sdk/dist/blockchain';
import hre from 'hardhat';
import { parseUnits } from 'viem';
import { getContractAt, getSigner } from '@nomiclabs/hardhat-ethers/internal/helpers';
import {
    impersonateAccount,
    setBalance,
    stopImpersonatingAccount,
} from '@nomicfoundation/hardhat-network-helpers';
import ERC20 from '../abis/ERC20.json';

jest.setTimeout(20000);

const mainnetForkConfig = structuredClone(config);
mainnetForkConfig[1]!.providerUrl = 'http://127.0.0.1:8545/';

describe('userDepositToVault test', () => {
    let hardhatNode: ChildProcess;

    beforeAll(async () => {
        hardhatNode = spawn('npx', ['hardhat', 'node', '--fork', `${config[1]?.providerUrl}`], {
            detached: true,
            stdio: 'ignore',
        });

        // Wait for Hardhat node to start
        await new Promise((resolve) => setTimeout(resolve, 5000));
    });

    afterAll(() => {
        if (hardhatNode) {
            hardhatNode.kill();
        }
    });

    it('happy path', async () => {
        const userAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

        // arrange
        const mockedFunctionOptions = {
            getProvider: jest.fn(),
            sendTransactions: jest.fn(
                async (props: SendTransactionProps): Promise<TransactionReturn> => {
                    await impersonateAccount(userAddress);

                    const userSigner = await getSigner(hre, props.account);
                    for (const tx of props.transactions) {
                        const sentTx = await userSigner.sendTransaction({
                            to: tx.target,
                            data: tx.data,
                        });
                        await sentTx.wait();
                    }

                    await stopImpersonatingAccount(userAddress);

                    return {
                        isMultisig: false,
                        data: [
                            {
                                message: 'mock approved',
                                hash: '0x00',
                            },
                        ],
                    };
                },
            ),
            notify: jest.fn(),
        } as jest.Mocked<FunctionOptions>;

        jest.replaceProperty(constants, 'config', mainnetForkConfig);

        await transferUSDC(userAddress, '1000');

        // act
        const props: UserDepositToVaultProps = {
            chainName: 'ethereum',
            account: userAddress,
            vaultAddress: '0xf07ac7f7dac4eaab2e4c6fc78230d8256df33cc8',
            amount: '100',
        };

        const result = await userDepositToVault(props, mockedFunctionOptions);

        // assert
        console.log(result);
        expect(result.success).toBeTruthy();
    });
});

async function transferUSDC(recipient: string, amount: string): Promise<void> {
    const usdcAddress = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'; // USDC token contract
    const whale = '0xCB66f5e69427b3947C62408aD8081A5047b6B3FD'; // USDC-rich account
    const amountInDecimals = parseUnits('1000', 6); // USDC has 6 decimals

    await setBalance(whale, 100n ** 18n);

    await impersonateAccount(whale);

    const whaleSigner = await getSigner(hre, whale);

    const usdc = await getContractAt(hre, ERC20.abi, usdcAddress, whaleSigner);

    const tx = await usdc.transfer(recipient, amountInDecimals);
    await tx.wait();

    await stopImpersonatingAccount(whale);

    console.log(`Transferred ${amount} USDC to ${recipient}`);
}

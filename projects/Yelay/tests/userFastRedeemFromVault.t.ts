import { FunctionOptions, SendTransactionProps } from '@heyanon/sdk';
import * as constants from '../constants';
import { config } from '../constants';
import { spawn, ChildProcess } from 'child_process';
import { TransactionReturn } from '@heyanon/sdk/dist/blockchain';
import hre from 'hardhat';
import { getSigner } from '@nomiclabs/hardhat-ethers/internal/helpers';
import {
    impersonateAccount,
    stopImpersonatingAccount,
} from '@nomicfoundation/hardhat-network-helpers';
import {
    userFastRedeemFromVault,
    UserFastRedeemFromVaultProps,
} from '../functions/userFastRedeemFromVault';

jest.setTimeout(20000);

const mainnetForkConfig = structuredClone(config);
mainnetForkConfig[1]!.providerUrl = 'http://127.0.0.1:8545/';

describe('userFastRedeemFromVault test', () => {
    let hardhatNode: ChildProcess;

    beforeAll(async () => {
        hardhatNode = spawn(
            'npx',
            [
                'hardhat',
                'node',
                '--fork',
                `${config[1]?.providerUrl}`,
                '--fork-block-number',
                '21767852',
            ],
            {
                detached: true,
                stdio: 'ignore',
            },
        );

        // Wait for Hardhat node to start
        await new Promise((resolve) => setTimeout(resolve, 5000));
    });

    afterAll(() => {
        if (hardhatNode) {
            hardhatNode.kill();
        }
    });

    it.skip('happy path', async () => {
        const userAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

        // arrange
        const mockedFunctionOptions = {
            getProvider: jest.fn(),
            sendTransactions: jest.fn(
                async (props: SendTransactionProps): Promise<TransactionReturn> => {
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
                },
            ),
            notify: jest.fn(),
        } as jest.Mocked<FunctionOptions>;

        jest.replaceProperty(constants, 'config', mainnetForkConfig);

        // act
        const props: UserFastRedeemFromVaultProps = {
            chainName: 'ethereum',
            account: userAddress,
            vaultAddress: '0xf07ac7f7dac4eaab2e4c6fc78230d8256df33cc8',
            assetsToWithdraw: '1',
        };

        const result = await userFastRedeemFromVault(props, mockedFunctionOptions);

        // assert
        console.log(result);
        expect(result.success).toBeTruthy();
    });
});

import { userDepositToVault } from '../src/functions';
import { UserDepositToVaultProps } from '../src/functions/userDepositToVault';
import * as constants from '../src/constants';
import { config } from '../src/constants';
import { ChildProcess } from 'child_process';
import { mockedFunctionOptions, setupMainnetFork, transferUSDC } from './_testUtils';

jest.setTimeout(20000);

describe('userDepositToVault test', () => {
    let hardhatNode: ChildProcess;

    beforeAll(async () => {
        hardhatNode = await setupMainnetFork(config[1]!.providerUrl);

        // change config to point to hardhat mainnet fork
        const mainnetForkConfig = structuredClone(config);
        mainnetForkConfig[1]!.providerUrl = 'http://127.0.0.1:8545/';
        jest.replaceProperty(constants, 'config', mainnetForkConfig);
    });

    afterAll(() => {
        if (hardhatNode) hardhatNode.kill();
    });

    it('happy path', async () => {
        const userAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

        // arrange
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

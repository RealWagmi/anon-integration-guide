import * as constants from '../src/constants';
import { config } from '../src/constants';
import { ChildProcess } from 'child_process';
import {
    userFastRedeemFromVault,
    UserFastRedeemFromVaultProps,
} from '../src/functions/userFastRedeemFromVault';
import { fundAddressWithEth, mockedFunctionOptions, setupMainnetFork } from './_testUtils';
import { Network, StaticJsonRpcProvider } from '@ethersproject/providers';
import * as utils from '../src/utils';
import { getMainnetConfig, SpoolSdk } from '@spool.fi/spool-v2-sdk';

jest.setTimeout(20000);

describe('userFastRedeemFromVault test', () => {
    let hardhatNode: ChildProcess;

    beforeAll(async () => {
        hardhatNode = await setupMainnetFork(config[1]!.providerUrl);

        // change config to point to hardhat mainnet fork
        const mainnetForkConfig = structuredClone(config);
        mainnetForkConfig[1]!.providerUrl = 'http://127.0.0.1:8545/';
        jest.replaceProperty(constants, 'config', mainnetForkConfig);

        // patch hardhat node to return mainnet
        const patchedProvider = new StaticJsonRpcProvider(mainnetForkConfig[1]!.providerUrl);
        patchedProvider.getNetwork = jest.fn(async (): Promise<Network> => {
            return {
                name: 'mainnet',
                chainId: 1,
            };
        });
        jest.spyOn(utils, 'getSdk').mockImplementation(() => {
            return new SpoolSdk(
                getMainnetConfig(mainnetForkConfig[1]!.subGraphUrl),
                patchedProvider,
            );
        });
    });

    afterAll(() => {
        if (hardhatNode) hardhatNode.kill();
    });

    it('happy path', async () => {
        const userAddress = '0x0574618d63747269688088e9a5bd43f2c3244668';

        // arrange
        await fundAddressWithEth(userAddress);

        // act
        const props: UserFastRedeemFromVaultProps = {
            chainName: 'ethereum',
            account: userAddress,
            vaultAddress: '0xf07ac7f7dac4eaab2e4c6fc78230d8256df33cc8',
            amount: '10000',
        };

        const result = await userFastRedeemFromVault(props, mockedFunctionOptions);

        // assert
        console.log(result);
        expect(result.success).toBeTruthy();
    });
});

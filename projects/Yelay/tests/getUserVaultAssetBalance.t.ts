import { GetUserSvtBalanceProps } from '../functions/getUserVaultSvtBalance';
import { FunctionOptions } from '@heyanon/sdk';
import { getUserVaultAssetBalance } from '../functions/getUserVaultAssetBalance';

jest.setTimeout(10000);

describe('getUserVaultSvtBalance', () => {
    it('happy path', async () => {
        // arrange
        const mockedFunctionOptions = {
            getProvider: jest.fn(),
            sendTransactions: jest.fn(),
            notify: jest.fn(),
        } as jest.Mocked<FunctionOptions>;

        const props: GetUserSvtBalanceProps = {
            chainName: 'ethereum',
            vaultAddress: '0x44d55292f05b345dd9517b435c70a5f3420ebfd8',
            account: '0x005e991137f4785d6bfa82ff0dcbea69e67146bb',
        };

        // act
        const result = await getUserVaultAssetBalance(props, mockedFunctionOptions);

        // assert
        console.log(result);
    });
});

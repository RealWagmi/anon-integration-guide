import { GetUserSvtBalanceProps } from '../src/functions/getUserVaultSvtBalance';
import { getUserVaultAssetBalance } from '../src/functions/getUserVaultAssetBalance';
import { mockedFunctionOptions } from './_testUtils';

jest.setTimeout(10000);

describe('getUserVaultSvtBalance', () => {
    it('happy path', async () => {
        // arrange

        // act
        const props: GetUserSvtBalanceProps = {
            chainName: 'ethereum',
            vaultAddress: '0x44d55292f05b345dd9517b435c70a5f3420ebfd8',
            account: '0x005e991137f4785d6bfa82ff0dcbea69e67146bb',
        };

        const result = await getUserVaultAssetBalance(props, mockedFunctionOptions);

        // assert
        console.log(result);
        expect(result.success).toBeTruthy();
    });
});

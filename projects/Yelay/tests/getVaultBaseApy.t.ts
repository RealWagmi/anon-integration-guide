import { FunctionOptions } from '@heyanon/sdk';
import { getVaultBaseApy, GetVaultBaseApyProps } from '../functions/getVaultBaseApy';

jest.setTimeout(20000);

describe('getVaultBaseApy', () => {
    it('happy path', async () => {
        // arrange
        const mockedFunctionOptions = {
            getProvider: jest.fn(),
            sendTransactions: jest.fn(),
            notify: jest.fn(),
        } as jest.Mocked<FunctionOptions>;

        const props: GetVaultBaseApyProps = {
            chainName: 'ethereum',
            vaultAddress: '0x44d55292f05b345dd9517b435c70a5f3420ebfd8',
        };

        // act
        const result = await getVaultBaseApy(props, mockedFunctionOptions);

        // assert
        console.log(result);
        expect(result.success).toBeTruthy();
    });
});

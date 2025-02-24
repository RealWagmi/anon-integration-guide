import { getVaultBaseApy, GetVaultBaseApyProps } from '../src/functions/getVaultBaseApy';
import { mockedFunctionOptions } from './_testUtils';

jest.setTimeout(20000);

describe('getVaultBaseApy', () => {
    it('happy path', async () => {
        // arrange

        // act
        const props: GetVaultBaseApyProps = {
            chainName: 'ethereum',
            vaultAddress: '0x44d55292f05b345dd9517b435c70a5f3420ebfd8',
        };

        const result = await getVaultBaseApy(props, mockedFunctionOptions);

        // assert
        console.log(result);
        expect(result.success).toBeTruthy();
    });
});

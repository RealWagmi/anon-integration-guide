import { FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { PendleClient } from '../helpers/client';
import { formatPositionsCompact } from '../helpers/positions';

interface Props {}

export async function getMyPositionsPortfolio(_props: Props, { notify, evm: { getAddress } }: FunctionOptions): Promise<FunctionReturn> {
    await notify('Checking portfolio...');
    const pendleClient = new PendleClient();
    const positionsForAllChains = await pendleClient.getAddressPositions(await getAddress());
    return toResult(await formatPositionsCompact(positionsForAllChains, ' - '));
}

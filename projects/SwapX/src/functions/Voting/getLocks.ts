import { ChainId, FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { Address, formatUnits } from 'viem';
import { SONIC_TOKENS } from '../../constants';
import { epochTimestampInSecToDate } from '../../utils';
import { VotingEscrow } from '../../utils/VotingEscrow';

interface Props {
    account: Address;
}

export async function getLocks({ account }: Props, { getProvider }: FunctionOptions): Promise<FunctionReturn> {
    if (!account) return toResult('Wallet not connected', true);

    const chainId = ChainId.SONIC;

    const provider = getProvider(chainId);

    const ve = new VotingEscrow(provider);

    const lockInfos = await ve.getSwpxLocksTokenIds(account);

    let locksMessage = '    No Locks Found';

    if (lockInfos.length > 0) {
        locksMessage = '';
        for (let t of lockInfos) {
            locksMessage += `   ID: ${t.lockId}\n`;
            locksMessage += `   Amount: ${formatUnits(BigInt(t.amount), SONIC_TOKENS.SWPx.decimals)}\n`;
            locksMessage += `   Unlock Time: ${epochTimestampInSecToDate(t.unlockTime)}\n\n`;
        }
    }

    return toResult(`SWPx locks list:\n\n${locksMessage}`);
}

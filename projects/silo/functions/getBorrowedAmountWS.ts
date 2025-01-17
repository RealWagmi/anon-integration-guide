import { Address, formatUnits } from 'viem';
import { FunctionReturn, toResult, getChainFromName, FunctionOptions } from '@heyanon/sdk';
import { STS_S_MARKET_ID, supportedChains } from '../constants';
import { fetchUserPosition } from './fetchUserPosition';

interface Props {
    chainName: string;
    account: Address;
}

export async function getBorrowedAmountWS({ chainName, account }: Props, { getProvider }: FunctionOptions): Promise<FunctionReturn> {
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Silo protocol is not supported on ${chainName}`, true);

    try {
        const { silo1 } = await fetchUserPosition(chainName, account, STS_S_MARKET_ID);
        return toResult(`Borrowed wS amount: ${formatUnits(silo1.debtBalance, 18)} wS`);
    } catch (e) {
        return toResult(`No borrowed wS amount found`, true);
    }
}

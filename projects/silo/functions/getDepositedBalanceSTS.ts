import { Address, formatUnits } from 'viem';
import { FunctionReturn, toResult, getChainFromName, FunctionOptions } from '@heyanon/sdk';
import { supportedChains, STS_S_MARKET_ID } from '../constants';
import { fetchUserPosition } from './fetchUserPosition';

interface Props {
    chainName: string;
    account: Address;
}

export async function getDepositedBalanceSTS({ chainName, account }: Props, { getProvider }: FunctionOptions): Promise<FunctionReturn> {
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Silo protocol is not supported on ${chainName}`, true);

    try {
        const { silo0 } = await fetchUserPosition(chainName, account, STS_S_MARKET_ID);
        return toResult(`Deposited stS balance: ${formatUnits(silo0.collateralBalance, 18)} stS`);
    } catch (e) {
        return toResult(`No borrowed wS amount found`, true);
    }
}

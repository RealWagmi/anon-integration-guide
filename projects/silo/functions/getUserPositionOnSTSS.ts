import axios from 'axios';
import { Address, formatUnits } from 'viem';
import { FunctionReturn, toResult, getChainFromName, FunctionOptions } from '@heyanon/sdk';
import { supportedChains, BORROWABLE_STS_DEPOSIT_ADDRESS, STS_S_MARKET_ID } from '../constants';
import { siloAbi } from '../abis';
import { fetchUserPosition } from './fetchUserPosition';

interface Props {
    chainName: string;
    account: Address;
}

export async function getUserPositionOnSTSS({ chainName, account }: Props, { getProvider }: FunctionOptions): Promise<FunctionReturn> {
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Silo protocol is not supported on ${chainName}`, true);

    try {
        const { silo0, silo1, healthFactor, borrowPowerUsed } = await fetchUserPosition(chainName, account, STS_S_MARKET_ID);

        const publicClient = getProvider(chainId);

        const maxWithdraw = (await publicClient.readContract({
            address: BORROWABLE_STS_DEPOSIT_ADDRESS,
            abi: siloAbi,
            functionName: 'maxWithdraw',
            args: [account],
        })) as bigint;

        return toResult(
            `Silo Finance Position on stS/S market:\n` +
                `Deposited: ${formatUnits(silo0.collateralBalance, 18)} stS\n` +
                `Borrowed: ${formatUnits(silo1.debtBalance, 18)} wS\n` +
                `Health factor: ${Math.trunc(parseFloat(formatUnits(healthFactor, 18)) * 100)})%\n` +
                `Borrow power used: ${Math.trunc(parseFloat(formatUnits(borrowPowerUsed, 18)) * 100)})%\n` +
                `Available to withdraw: ${formatUnits(maxWithdraw, 18)} stS`,
        );
    } catch (e) {
        return toResult(`Failed to get user position on stS/S market`, true);
    }
}

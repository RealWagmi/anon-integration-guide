import type { Address } from 'viem';
import { type FunctionReturn, getChainFromName, toResult } from '@heyanon/sdk';
import { supportedChains } from '../constants';

import { getActivities, type Platform, type Tag, type Type, type Network, type ActivitiesResponse } from '@rss3/sdk'

interface Props {
    account: Address;
    chainName?: string;
    platform?: Platform[];
    tag?: Tag[];
    type?: Type[];
    limit: number;
}

/**
 * Fetch the latest address-based activities to be consumed by AI agents for analysis and decision-making
 * @param props - The function parameters
 * @returns The list of address-based activities
 */
export async function getAddressActivities({ account, chainName, platform = [], tag = [], type = [], limit = 20 }: Props): Promise<FunctionReturn> {
    // chain name is optional, if provided, check if it is supported
    if (chainName) {
        const chainId = getChainFromName(chainName);
        if (!chainId)
            return toResult(`Unsupported chain name: ${chainName}`, true);
        if (!supportedChains.includes(chainId))
            return toResult(
                `RSS3 currently does not supported ${chainName}`,
                true,
            );
    }

    let activities: ActivitiesResponse;
    try {
        activities = await getActivities({
            account: account,
            tag: tag,
            type: type,
            network: chainName ? [convertNetwork(chainName.toLowerCase())] : undefined,
            platform: platform,
            limit: limit,
        });
    } catch (error) {
        return toResult(JSON.stringify(error), true);
    }

    return toResult(JSON.stringify(activities.data), false);
}


function convertNetwork(value: string): Network {
    let networkName = value.toLowerCase();

    switch (value) {
        case "bsc":
            networkName = "binance-smart-chain";
            break;
        case "avalanche":
            networkName = "avax";
            break;
    }

    return networkName as Network;
}
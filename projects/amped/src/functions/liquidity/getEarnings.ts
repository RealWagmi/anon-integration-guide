import { Address, getContract, PublicClient, Chain, Transport } from 'viem';
import { FunctionReturn, FunctionOptions, toResult, EVM } from '@heyanon/sdk';
const { getChainFromName } = EVM.utils;
import { CONTRACT_ADDRESSES, SupportedChain } from '../../constants.js';
import { RewardTracker } from '../../abis/RewardTracker.js';
import { VaultPriceFeed } from '../../abis/VaultPriceFeed.js';

interface Props {
    chainName: 'sonic' | 'base';
    account: Address;
}

/**
 * Gets earnings information for a user's staked tokens
 * @param props - The function parameters
 * @param props.chainName - The name of the chain (must be "sonic")
 * @param props.account - The account address to check earnings for
 * @param options - System tools for blockchain interactions
 * @returns Earnings information including claimable rewards, staked amount, and reward token price
 */
export async function getEarnings({ chainName, account }: Props, options: FunctionOptions): Promise<FunctionReturn> {
    const { evm: { getProvider }, notify } = options;
    // Validate chain
    if (chainName !== 'sonic' && chainName !== 'base') {
        return toResult(`Network ${chainName} not supported`, true);
    }

    await notify('Checking earnings information...');

    try {
        const provider = getProvider(146) as unknown as PublicClient<Transport, Chain>; // Sonic chain ID
        const rewardTrackerAddress = CONTRACT_ADDRESSES[SupportedChain.SONIC].REWARD_TRACKER;
        const fsAlpAddress = CONTRACT_ADDRESSES[SupportedChain.SONIC].FS_ALP;
        const wrappedNativeTokenAddress = CONTRACT_ADDRESSES[SupportedChain.SONIC].WRAPPED_NATIVE_TOKEN;
        const vaultPriceFeedAddress = CONTRACT_ADDRESSES[SupportedChain.SONIC].VAULT_PRICE_FEED;

        const [claimableRewards, stakedAmount, rewardTokenPrice] = await Promise.all([
            provider.readContract({
                address: rewardTrackerAddress,
                abi: RewardTracker,
                functionName: 'claimable',
                args: [account],
            }),
            provider.readContract({
                address: fsAlpAddress,
                abi: RewardTracker,
                functionName: 'stakedAmounts',
                args: [account],
            }),
            provider.readContract({
                address: vaultPriceFeedAddress,
                abi: VaultPriceFeed,
                functionName: 'getPrice',
                args: [wrappedNativeTokenAddress, false, true, false],
            }),
        ]);

        // The price is returned with 30 decimals of precision
        const rewardTokenPriceUsd = rewardTokenPrice.toString();
        const rewardValueUsd = (claimableRewards * rewardTokenPrice) / 10n ** 30n;

        return toResult(
            JSON.stringify({
                claimableRewards: claimableRewards.toString(),
                stakedAmount: stakedAmount.toString(),
                rewardTokenPriceUsd,
                rewardValueUsd: rewardValueUsd.toString(),
            }),
        );
    } catch (error) {
        if (error instanceof Error) {
            return toResult(`Failed to get earnings information: ${error.message}`, true);
        }
        return toResult('Failed to get earnings information: Unknown error', true);
    }
}

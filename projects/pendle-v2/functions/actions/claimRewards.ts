import { type Address } from 'viem';
import { FunctionReturn, toResult, getChainFromName } from '@heyanon/sdk';
import { supportedChains, ADDRESSES } from '../../constants';
import { marketAbi } from '../../abis';
import { handleError, PendleError, ERRORS } from '../../utils/errors';
import { validateChain, validateMarket } from '../../utils/validation';

interface Props {
    chainName: string;
    account: Address;
    marketAddress: Address;
}

interface Dependencies {
    sendTransactions: (params: any) => Promise<any>;
    notify: (message: string) => Promise<void>;
    getProvider: () => any;
}

export async function claimRewards(
    { chainName, account, marketAddress }: Props,
    { sendTransactions, notify, getProvider }: Dependencies
): Promise<FunctionReturn> {
    try {
        const chainId = getChainFromName(chainName);
        const provider = getProvider();

        // Validate market address
        try {
            await provider.readContract({
                address: marketAddress,
                abi: marketAbi,
                functionName: 'isExpired'
            });
        } catch (error: any) {
            return { success: false, data: `ERROR: Invalid market address: ${marketAddress}` };
        }

        await notify('Preparing to claim rewards...');
        await notify('Waiting for transaction confirmation...');

        const result = await sendTransactions({
            chainId,
            account,
            transactions: [{
                target: marketAddress,
                data: '0x58f3d163' // claimRewards()
            }]
        });

        return { success: true, data: `Successfully claimed Pendle rewards. ${result.data}` };
    } catch (error: any) {
        return { success: false, data: `ERROR: ${error.message}` };
    }
} 
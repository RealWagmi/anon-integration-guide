import { type Address } from 'viem';
import { type Result } from '../../types';
import { ValidationError } from '../../utils/errors';
import { validateAddress } from '../../utils/validation';
import { yieldTokenAbi } from '../../abis';

export async function mintPY(
    receiverPT: Address,
    receiverYT: Address,
    { getProvider, sendTransactions, notify }: { getProvider: Function; sendTransactions: Function; notify: Function }
): Promise<Result<{ amountPYOut: string }>> {
    try {
        validateAddress(receiverPT);
        validateAddress(receiverYT);

        const provider = getProvider();
        const txParams = {
            abi: yieldTokenAbi,
            functionName: 'mintPY',
            args: [receiverPT, receiverYT]
        };

        const result = await sendTransactions({ params: txParams });
        await notify('Successfully minted PY tokens');

        return {
            success: true,
            data: {
                amountPYOut: result.data.amountPYOut.toString()
            }
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function redeemPY(
    receiver: Address,
    { getProvider, sendTransactions, notify }: { getProvider: Function; sendTransactions: Function; notify: Function }
): Promise<Result<{ amountSyOut: string }>> {
    try {
        validateAddress(receiver);

        const provider = getProvider();
        const txParams = {
            abi: yieldTokenAbi,
            functionName: 'redeemPY',
            args: [receiver]
        };

        const result = await sendTransactions({ params: txParams });
        await notify('Successfully redeemed PY tokens');

        return {
            success: true,
            data: {
                amountSyOut: result.data.amountSyOut.toString()
            }
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function redeemPYMulti(
    receivers: Address[],
    amountPYToRedeems: string[],
    { getProvider, sendTransactions, notify }: { getProvider: Function; sendTransactions: Function; notify: Function }
): Promise<Result<{ amountSyOuts: string[] }>> {
    try {
        receivers.forEach(validateAddress);
        if (receivers.length !== amountPYToRedeems.length) {
            throw new ValidationError('Receivers and amounts arrays must have the same length');
        }

        const provider = getProvider();
        const txParams = {
            abi: yieldTokenAbi,
            functionName: 'redeemPYMulti',
            args: [receivers, amountPYToRedeems]
        };

        const result = await sendTransactions({ params: txParams });
        await notify('Successfully redeemed multiple PY tokens');

        return {
            success: true,
            data: {
                amountSyOuts: result.data.amountSyOuts.map((amount: bigint) => amount.toString())
            }
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function redeemDueInterestAndRewards(
    user: Address,
    redeemInterest: boolean,
    redeemRewards: boolean,
    { getProvider, sendTransactions, notify }: { getProvider: Function; sendTransactions: Function; notify: Function }
): Promise<Result<{ interestOut: string; rewardsOut: string[] }>> {
    try {
        validateAddress(user);

        const provider = getProvider();
        const txParams = {
            abi: yieldTokenAbi,
            functionName: 'redeemDueInterestAndRewards',
            args: [user, redeemInterest, redeemRewards]
        };

        const result = await sendTransactions({ params: txParams });
        await notify('Successfully redeemed interest and rewards');

        return {
            success: true,
            data: {
                interestOut: result.data.interestOut.toString(),
                rewardsOut: result.data.rewardsOut.map((amount: bigint) => amount.toString())
            }
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
} 
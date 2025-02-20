import { ChainId, checkToApprove, FunctionOptions, toResult, TransactionParams } from '@heyanon/sdk';
import { Address, encodeFunctionData, erc20Abi, formatUnits, parseUnits } from 'viem';
import { SONIC_TOKENS, veSWPxAddress, WEEK_IN_SECONDS } from '../../constants';
import BigNumber from 'bignumber.js';
import { votingEscrowAbi } from '../../abis/votingEscrowAbi';

interface Props {
    account: Address;
    // SWPx lock amount must be greater than 0
    swpxLockAmount: string;
    // Lock time in seconds, where (unlockTime = now + swpxLockTime / 1 week * 1 week)
    // require(unlockTime > now)
    swpxLockTime: number;
}

export async function lockSWPx({ account, swpxLockAmount, swpxLockTime }: Props, { sendTransactions, notify, getProvider }: FunctionOptions) {
    if (!account) return toResult('Wallet not connected', true);

    await notify('Preparing to lock SWPx...');

    const chainId = ChainId.SONIC;

    const provider = getProvider(chainId);

    const timestampNow = (await provider.getBlock()).timestamp.toString();

    const MAX_LOCK_TIME = 2 * 365 * 86400;

    const unlockTime = new BigNumber(timestampNow).plus(swpxLockTime).div(WEEK_IN_SECONDS).times(WEEK_IN_SECONDS);

    if (swpxLockAmount == '0') return toResult('SWPx lock amount must be greater than 0', true);
    if (unlockTime.lte(timestampNow)) return toResult('SWPx lock time must be sufficient to reach next (Thursday 00:00 UTC)', true);
    if (swpxLockTime > MAX_LOCK_TIME) return toResult('Exceeds the maximum lock time of 2 years', true);

    const swpxLockAmountInWei = parseUnits(swpxLockAmount, SONIC_TOKENS.SWPx.decimals);

    const userBalance = await provider.readContract({
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [account],
        address: SONIC_TOKENS.SWPx.address,
    });

    if (userBalance < swpxLockAmountInWei)
        return toResult(`Insufficient SWPx amount! Wants ${swpxLockAmount} SWPx but only Has ${formatUnits(userBalance, SONIC_TOKENS.SWPx.decimals)} SWPx.`, true);

    const transactions: TransactionParams[] = [];

    await checkToApprove({
        args: {
            account,
            target: SONIC_TOKENS.SWPx.address,
            spender: veSWPxAddress,
            amount: swpxLockAmountInWei,
        },
        provider,
        transactions,
    });

    transactions.push({
        target: veSWPxAddress,
        data: encodeFunctionData({
            abi: votingEscrowAbi,
            functionName: 'create_lock',
            args: [swpxLockAmountInWei, swpxLockTime],
        }),
    });

    await notify('Waiting for transaction confirmation...');

    const result = await sendTransactions({ chainId, account, transactions });

    const lockMessage = result.data[result.data.length - 1];

    return toResult(result.isMultisig ? lockMessage.message : `Successfully Locked ${swpxLockAmount} SWPx. ${lockMessage.message}`);
}

import { Address, encodeFunctionData, formatUnits, parseUnits } from 'viem';
import { FunctionReturn, FunctionOptions, TransactionParams, toResult, getChainFromName } from '@heyanon/sdk';
import { supportedChains, STS_ADDRESS, MIN_UNDELEGATE_IN_WEI } from '../constants';
import { stsAbi } from '../abis';
import { fetchValidators, findHighestDelegatedValidator } from '../helpers/client';

interface Props {
    chainName: string;
    account: Address;
    amount: string;
}

/**
 * Unstake staked Sonic tokens (stS)
 *
 * This action will initiate the undelegation of staked Sonic tokens (stS)
 * from the Beets.fi liquid staking module, which will take 14 days to complete.
 *
 * After 14 days, the user will be able to withdraw their Sonic tokens (S)
 * using the `withdraw` function.
 */
export async function unStake({ chainName, account, amount }: Props, { sendTransactions, notify, getProvider }: FunctionOptions): Promise<FunctionReturn> {
    if (!account) return toResult('Wallet not connected', true);

    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Beets protocol is not supported on ${chainName}`, true);

    const amountInWei = parseUnits(amount, 18);
    if (amountInWei < MIN_UNDELEGATE_IN_WEI) return toResult(`Amount must be greater than ${formatUnits(MIN_UNDELEGATE_IN_WEI, 18)} stS`, true);

    // Get the public client to read contract data
    const publicClient = getProvider(chainId);

    await notify(`Preparing to unstake ${amount} stS...`);

    // Check that the user has enough stS to undelegate
    const stsBalance = await publicClient.readContract({
        address: STS_ADDRESS,
        abi: stsAbi,
        functionName: 'balanceOf',
        args: [account],
    });
    if (stsBalance < amountInWei) {
        return toResult(`You do not have enough stS to undelegate. Current balance: ${formatUnits(stsBalance, 18)} stS`, true);
    }

    try {
        // Find the validator with the highest amount of assets delegated
        const validators = await fetchValidators();
        if (!validators.length) {
            return toResult('No validators found', true);
        }
        const targetValidator = findHighestDelegatedValidator(validators);

        // Check if validator has enough staked assets
        if (parseUnits(targetValidator.assetsDelegated, 18) < amountInWei) {
            return toResult(`Validator does not have enough staked assets. Maximum available: ${targetValidator.assetsDelegated}`, true);
        }

        const transactions: TransactionParams[] = [];
        const tx: TransactionParams = {
            target: STS_ADDRESS,
            data: encodeFunctionData({
                abi: stsAbi,
                functionName: 'undelegateMany',
                args: [[BigInt(targetValidator.validatorId)], [amountInWei]],
            }),
        };
        transactions.push(tx);

        await notify('Sending transaction...');

        const result = await sendTransactions({ chainId, account, transactions });
        const message = result.data[result.data.length - 1].message;
        return toResult(result.isMultisig ? message : `Successfully initiated unstaking of ${amount} stS. You can withdraw your Sonic tokens after 14 days. ${message}`);
    } catch (error) {
        return toResult(`Failed to ustake: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
    }
}

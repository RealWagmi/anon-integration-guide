import { Address, encodeFunctionData, parseUnits } from 'viem';
import { FunctionReturn, FunctionOptions, TransactionParams, toResult, getChainFromName } from '@heyanon/sdk';
import { supportedChains, STS_ADDRESS } from '../constants';
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
    if (amountInWei === 0n) return toResult('Amount must be greater than 0', true);

    // Get the public client to read contract data
    const publicClient = getProvider(chainId);

    // Convert asset amount to shares amount
    const sharesAmount = await publicClient.readContract({
        address: STS_ADDRESS,
        abi: stsAbi,
        functionName: 'convertToShares',
        args: [amountInWei],
    });

    await notify('Fetching staking data...');

    try {
        const validators = await fetchValidators();
        if (!validators.length) {
            return toResult('No validators found', true);
        }

        const targetValidator = findHighestDelegatedValidator(validators);

        if (BigInt(targetValidator.assetsDelegated) < amountInWei) {
            return toResult(`Validator does not have enough staked assets. Maximum available: ${targetValidator.assetsDelegated}`, true);
        }

        await notify('Preparing to undelegate Sonic tokens from Beets.fi liquid staking module...');

        const transactions: TransactionParams[] = [];
        const tx: TransactionParams = {
            target: STS_ADDRESS,
            data: encodeFunctionData({
                abi: stsAbi,
                functionName: 'undelegateMany',
                args: [
                    [BigInt(targetValidator.validatorId)], // validatorIds array
                    [sharesAmount], // amountShares array - now using converted shares amount
                ],
            }),
        };
        transactions.push(tx);

        await notify('Waiting for transaction confirmation...');

        const result = await sendTransactions({ chainId, account, transactions });
        return toResult(
            result.isMultisig
                ? result.data[result.data.length - 1].message
                : `Successfully initiated undelegation of ${amount} stS from Beets.fi liquid staking module. You can withdraw your Sonic tokens after 14 days.`,
        );
    } catch (error) {
        return toResult(`Failed to undelegate: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
    }
}

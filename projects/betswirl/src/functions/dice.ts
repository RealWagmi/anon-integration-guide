import { EVM, FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { Hex } from 'viem';
import { CASINO_GAME_TYPE, DiceNumber, Dice, initViemBetSwirlClient } from '@betswirl/sdk-core';
import {
    getBetToken,
    getBetAmountInWei,
    getPlaceBetTransactionParams,
    validateWallet,
    getChainId,
    hasEnoughBalance,
    CommonProps,
    isGameLive,
    waitRolledBet,
    getResult,
    approveERC20,
} from '../utils';

interface Props extends CommonProps {
    number: DiceNumber;
}

/**
 * Rolls a dice in the BetSwirl casino game.
 *
 * @param {Object} params - The parameters for the dice roll.
 * @param {string} params.chainName - The name of the blockchain network.
 * @param {string} params.account - The account address of the user.
 * @param {string} params.tokenSymbol - The symbol of the token to bet with.
 * @param {number} params.betAmount - The amount to bet.
 * @param {number} params.number - The number to bet on.
 * @param {Object} options - The function options.
 * @param {Object} options.evm - The EVM options.
 * @param {Function} options.evm.getProvider - Function to get the provider for the specified chain.
 * @param {Function} options.evm.sendTransactions - Function to send transactions.
 * @param {Function} options.notify - Function to send notifications.
 * @returns {Promise<FunctionReturn>} The result of the dice roll.
 * @throws Will throw an error if the dice bet cannot be retrieved or if any validation fails.
 */
export async function dice({ chainName, account, tokenSymbol, betAmount, number }: Props, options: FunctionOptions): Promise<FunctionReturn> {
    const {
        evm: { getProvider, sendTransactions },
        notify,
    } = options;

    try {
        // Validate chain name
        const chainId = getChainId(chainName);
        // Create the BetSwirl SDK client
        const provider = getProvider(chainId);
        const betswirlClient = initViemBetSwirlClient(provider, undefined, {
            chainId: chainId,
        });
        // Check if the game is live
        await isGameLive(betswirlClient, CASINO_GAME_TYPE.DICE);
        // Validate the account
        validateWallet(account);
        // Validate the token
        const token = await getBetToken(betswirlClient, tokenSymbol);
        // Validate the bet amount
        const betAmountInWei = getBetAmountInWei(betAmount, token);
        // Validate the number
        // TODO

        await notify('Rolling the dice...');
        const transactions: EVM.types.TransactionParams[] = [];
        const placeBetTransactionParams = await getPlaceBetTransactionParams(betswirlClient, CASINO_GAME_TYPE.DICE, Dice.encodeInput(number), Dice.getMultiplier(number), {
            betAmount: betAmountInWei,
            betToken: token,
            betCount: 1,
            receiver: account as Hex,
            stopGain: 0n,
            stopLoss: 0n,
        });
        // Validate the balance
        await hasEnoughBalance(provider, token, account, placeBetTransactionParams.value, betAmountInWei);
        // Optionally approve ERC20 token
        await approveERC20(betswirlClient, account, CASINO_GAME_TYPE.DICE, token, betAmountInWei, transactions);

        transactions.push(placeBetTransactionParams);
        const { data } = await sendTransactions({
            chainId,
            account,
            transactions,
        });

        await notify('The dice is rolling...');
        const rolledBet = await waitRolledBet(betswirlClient, data[1].hash, CASINO_GAME_TYPE.DICE);

        return toResult(getResult(rolledBet, chainId));
    } catch (error) {
        return toResult(error instanceof Error ? error.message : 'Unknown error', true);
    }
}

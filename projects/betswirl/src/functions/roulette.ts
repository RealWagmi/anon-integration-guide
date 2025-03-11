import { FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { Hex } from 'viem';
import { CASINO_GAME_TYPE, RouletteNumber, Roulette, initViemBetSwirlClient } from '@betswirl/sdk-core';
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
} from '../utils';

interface Props extends CommonProps {
    numbers: RouletteNumber[];
}

/**
 * Executes a roulette bet on the BetSwirl platform.
 *
 * @param {Props} params - The parameters for the roulette bet.
 * @param {string} params.chainName - The name of the blockchain network.
 * @param {string} params.account - The account address placing the bet.
 * @param {string} params.tokenSymbol - The symbol of the token used for the bet.
 * @param {string} params.betAmount - The amount of the bet.
 * @param {number[]} params.numbers - The numbers chosen for the roulette bet.
 * @param {FunctionOptions} options - Additional options for the function.
 * @param {Object} options.evm - The EVM-related options.
 * @param {Function} options.evm.getProvider - Function to get the blockchain provider.
 * @param {Function} options.evm.sendTransactions - Function to send transactions.
 * @param {Function} options.notify - Function to send notifications.
 * @returns {Promise<FunctionReturn>} - The result of the roulette bet.
 * @throws {Error} - Throws an error if the bet cannot be placed or retrieved.
 */
export async function roulette({ chainName, account, tokenSymbol, betAmount, numbers }: Props, options: FunctionOptions): Promise<FunctionReturn> {
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
        await isGameLive(betswirlClient, CASINO_GAME_TYPE.ROULETTE);
        // Validate the account
        validateWallet(account);
        // Validate the token
        const token = await getBetToken(betswirlClient, tokenSymbol);
        // Validate the bet amount
        const betAmountInWei = getBetAmountInWei(betAmount, token);
        // Validate the number
        // TODO

        await notify('Spinning the roulette...');
        const placeBetTransactionParams = await getPlaceBetTransactionParams(
            betswirlClient,
            CASINO_GAME_TYPE.ROULETTE,
            Roulette.encodeInput(numbers),
            Roulette.getMultiplier(numbers),
            {
                betAmount: betAmountInWei,
                betToken: token,
                betCount: 1,
                receiver: account as Hex,
                stopGain: 0n,
                stopLoss: 0n,
            }
        );
        // Validate the balance
        await hasEnoughBalance(provider, token, account, placeBetTransactionParams.value);

        const { data } = await sendTransactions({
            chainId,
            account,
            transactions: [placeBetTransactionParams],
        });

        await notify('The roulette is spinning...');
        const rolledBet = await waitRolledBet(betswirlClient, data[0].hash, CASINO_GAME_TYPE.ROULETTE);

        return toResult(getResult(rolledBet, chainId));
    } catch (error) {
        return toResult(error instanceof Error ? error.message : 'Unknown error', true);
    }
}

import { EVM, FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { Hex } from 'viem';
import { CASINO_GAME_TYPE, CoinToss, COINTOSS_FACE, initViemBetSwirlClient } from '@betswirl/sdk-core';
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
    face: COINTOSS_FACE;
}

/**
 * Flips a coin in the BetSwirl casino game.
 *
 * @param {Object} params - The parameters for the coin flip.
 * @param {string} params.chainName - The name of the blockchain network.
 * @param {string} params.account - The account address of the user.
 * @param {string} params.tokenSymbol - The symbol of the token to bet with.
 * @param {string} params.betAmount - The amount to bet.
 * @param {COINTOSS_FACE} params.face - The face of the coin to bet on (heads or tails).
 * @param {FunctionOptions} options - Additional options for the function.
 * @returns {Promise<FunctionReturn>} The result of the coin flip.
 * @throws {Error} If any validation fails or an error occurs during the process.
 */
export async function coinToss({ chainName, account, tokenSymbol, betAmount, face }: Props, options: FunctionOptions): Promise<FunctionReturn> {
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
        await isGameLive(betswirlClient, CASINO_GAME_TYPE.COINTOSS);
        // Validate the account
        validateWallet(account);
        // Validate the token
        const token = await getBetToken(betswirlClient, tokenSymbol);
        // Validate the bet amount
        const betAmountInWei = getBetAmountInWei(betAmount, token);
        // Validate face is heads or tails
        // if (!face || ![COINTOSS_FACE.HEADS, COINTOSS_FACE.TAILS].includes(face)) {
        //     throw new Error('Face must be heads or tails');
        // }

        await notify('Flipping the coin...');
        const transactions: EVM.types.TransactionParams[] = [];
        const placeBetTransactionParams = await getPlaceBetTransactionParams(betswirlClient, CASINO_GAME_TYPE.COINTOSS, CoinToss.encodeInput(face), CoinToss.getMultiplier(face), {
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
        await approveERC20(betswirlClient, account, CASINO_GAME_TYPE.COINTOSS, token, betAmountInWei, transactions);

        transactions.push(placeBetTransactionParams);
        const { data } = await sendTransactions({
            chainId,
            account,
            transactions,
        });

        await notify('The coin is flipping...');
        const rolledBet = await waitRolledBet(betswirlClient, data[1].hash, CASINO_GAME_TYPE.COINTOSS);

        return toResult(getResult(rolledBet, chainId));
    } catch (error) {
        return toResult(error instanceof Error ? error.message : 'Unknown error', true);
    }
}

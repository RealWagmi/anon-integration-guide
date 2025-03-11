import { Hex, Address, parseUnits, PublicClient } from 'viem';
import { EVM, EvmChain } from '@heyanon/sdk';

import {
    CASINO_GAME_TYPE,
    CasinoChainId,
    GameEncodedInput,
    Token,
    chainNativeCurrencyToToken,
    getPlaceBetFunctionData,
    ViemBetSwirlClient,
    casinoChainIds,
    formatRawAmount,
    chainById,
    getCasinoGamePaused,
    getTransactionReceiptWithRetry,
    getPlacedBetFromReceipt,
    CasinoRolledBet,
    formatTxnUrl,
    getBetSwirlBetUrl,
} from '@betswirl/sdk-core';

/**
 * Checks if a casino game is live by querying the BetSwirl client.
 * If the game is paused, an error is thrown.
 *
 * @param betswrilClient - The BetSwirl client instance used to query the game status.
 * @param game - The type of the casino game to check.
 * @throws Will throw an error if the game is paused.
 * @returns A promise that resolves if the game is live, otherwise throws an error.
 */
export async function isGameLive(betswirlClient: ViemBetSwirlClient, game: CASINO_GAME_TYPE) {
    const paused = await getCasinoGamePaused(betswirlClient.betSwirlWallet, game);
    if (paused) {
        throw new Error(`The game ${game} is paused`);
    }
}

/**
 * Retrieves the bet token based on the provided token symbol input.
 *
 * @param {ViemBetSwirlClient} betswirlClient - The BetSwirl client instance.
 * @param {string} [tokenSymbolInput] - The optional token symbol input. If provided, it must match the native currency symbol of the chain.
 * @returns {Promise<Token>} - A promise that resolves to the selected token or undefined if no token is selected.
 * @throws {Error} - Throws an error if no chain is found on the provider or if the token symbol input does not match the native currency symbol.
 */
export async function getBetToken(betswirlClient: ViemBetSwirlClient, tokenSymbolInput?: string): Promise<Token> {
    const chainId = betswirlClient.betSwirlWallet.getChainId();
    const chain = chainById[chainId as CasinoChainId];
    let selectedToken: Token;
    if (tokenSymbolInput && tokenSymbolInput !== chain.nativeCurrency.symbol) {
        // For now accept bets only with the native token.
        throw new Error(`The token symbol must be ${chain.nativeCurrency.symbol}`);
        // const casinoTokens = await betswirlClient.getCasinoTokens(true);
        // // Validate the token
        // selectedToken = casinoTokens.find((casinoToken) => casinoToken.symbol === tokenSymbolInput);
        // if (!selectedToken) {
        //     throw new Error(`The token must be one of ${casinoTokens.map((casinoToken) => casinoToken.symbol).join(', ')}`);
        // }
    } else {
        selectedToken = chainNativeCurrencyToToken(chain.nativeCurrency);
    }
    return selectedToken;
}

/**
 * Converts a bet amount from a string to its equivalent value in Wei.
 *
 * @param betAmount - The bet amount as a string.
 * @param token - The token object containing the decimals property.
 * @returns The bet amount in Wei as a BigInt.
 * @throws Will throw an error if the bet amount is less than or equal to 0.
 */
export function getBetAmountInWei(betAmount: string, token: Token) {
    const betAmountInWei = parseUnits(betAmount, token.decimals);
    if (betAmountInWei <= 0n) {
        throw new Error('The bet amount must be greater than 0');
    }
    return betAmountInWei;
}

/**
 * Generates the parameters required to place a bet transaction.
 *
 * @param betswirlClient - The client instance of ViemBetSwirlClient.
 * @param game - The type of casino game being played.
 * @param gameEncodedInput - The encoded input data for the game.
 * @param gameMultiplier - The multiplier for the game.
 * @param casinoGameParams - The parameters for the casino game bet.
 * @param casinoGameParams.betAmount - The amount being bet.
 * @param casinoGameParams.betToken - The token being used for the bet.
 * @param casinoGameParams.betCount - The number of bets being placed.
 * @param casinoGameParams.receiver - The receiver address for the bet.
 * @param casinoGameParams.stopGain - The stop gain limit for the bet.
 * @param casinoGameParams.stopLoss - The stop loss limit for the bet.
 * @returns An object containing the target address, encoded data, and value for the transaction.
 * @throws Will throw an error if no chain is found on the provider.
 * @throws Will throw an error if the token is not allowed for betting.
 * @throws Will throw an error if the bet amount exceeds the maximum allowed bet amount.
 * @throws Will throw an error if the bet count exceeds the maximum allowed bet count.
 * @throws Will throw an error if there is an issue while placing the bet.
 */
export async function getPlaceBetTransactionParams(
    betswirlClient: ViemBetSwirlClient,
    game: CASINO_GAME_TYPE,
    gameEncodedInput: GameEncodedInput,
    gameMultiplier: number,
    casinoGameParams: {
        betAmount: bigint;
        betToken: Token;
        betCount: number;
        receiver: Hex;
        stopGain: bigint;
        stopLoss: bigint;
    }
): Promise<{
    target: Address;
    data: Hex;
    value: bigint;
}> {
    const chainId = betswirlClient.betSwirlWallet.getChainId();
    const chain = chainById[chainId as CasinoChainId];
    const betRequirements = await betswirlClient.getBetRequirements(casinoGameParams.betToken, gameMultiplier, game);

    if (!betRequirements.isAllowed) {
        throw new Error(`The token isn't allowed for betting`);
    }
    if (casinoGameParams.betAmount > betRequirements.maxBetAmount) {
        throw new Error(`Bet amount should be less than ${betRequirements.maxBetAmount}`);
    }
    if (casinoGameParams.betCount > betRequirements.maxBetCount) {
        throw new Error(`Bet count should be less than ${betRequirements.maxBetCount}`);
    }

    const functionData = getPlaceBetFunctionData(
        {
            betAmount: casinoGameParams.betAmount,

            game,
            gameEncodedInput: gameEncodedInput,
            receiver: casinoGameParams.receiver,
            betCount: casinoGameParams.betCount,
            tokenAddress: casinoGameParams.betToken.address,
            stopGain: casinoGameParams.stopGain,
            stopLoss: casinoGameParams.stopLoss,
        },
        chain.id as CasinoChainId
    );

    try {
        const gasPrice = ((await betswirlClient.publicClient.getGasPrice()) * 120n) / 100n;
        const vrfCost = ((await betswirlClient.getChainlinkVrfCost(game, casinoGameParams.betToken.address, casinoGameParams.betCount, gasPrice)) * 120n) / 100n;
        return {
            target: functionData.data.to,
            data: functionData.encodedData,
            value: functionData.extraData.getValue(vrfCost),
            // gas: 0n
        };
    } catch (error) {
        throw new Error(`An error occured while placing the bet: ${error}`);
    }
}

/**
 * Waits for a bet to be rolled and returns the rolled bet.
 *
 * @param {ViemBetSwirlClient} betswrilClient - The BetSwirl client instance.
 * @param {Hex} betTxnHash - The transaction hash of the bet.
 * @param {CASINO_GAME_TYPE} game - The type of the casino game.
 * @returns {Promise<RolledBet>} A promise that resolves to the rolled bet.
 * @throws {Error} If the bet cannot be retrieved.
 */
export async function waitRolledBet(betswirlClient: ViemBetSwirlClient, betTxnHash: Hex, game: CASINO_GAME_TYPE): Promise<CasinoRolledBet> {
    const receipt = await getTransactionReceiptWithRetry(betswirlClient.betSwirlWallet, betTxnHash);
    const bet = await getPlacedBetFromReceipt(betswirlClient.betSwirlWallet, receipt, game);
    if (!bet) {
        throw new Error('Coin Toss bet cannot be retrieved');
    }
    const { rolledBet } = await betswirlClient.waitRolledBet(bet, { timeout: 120000 });
    return rolledBet;
}

/**
 * Generates a JSON string representing the result of a casino bet.
 *
 * @param bet - The casino bet object containing details of the bet.
 * @param chainId - The chain ID of the casino.
 * @returns A JSON string containing the result of the bet.
 */
export function getResult(bet: CasinoRolledBet, chainId: CasinoChainId) {
    return JSON.stringify({
        message: `${bet.game} bet rolled!`,
        bet: {
            id: String(bet.id),
            betTxnHash: bet.betTxnHash,
            betTxnLink: formatTxnUrl(bet.betTxnHash, chainId),
            betAmount: bet.formattedBetAmount,
            token: bet.token.symbol,
            isWin: bet.isWin,
            payoutMultiplier: bet.formattedPayoutMultiplier,
            rolled: bet.decodedRolled,
            payout: bet.formattedPayout,
            rollTxnHash: bet.rollTxnHash,
            rollTxnLink: formatTxnUrl(bet.rollTxnHash, chainId),
            linkOnBetSwirl: getBetSwirlBetUrl(bet.id, bet.game, chainId),
        },
    });
}

/**
 * Validates if the provided wallet address is connected.
 *
 * @param account - The wallet address to validate.
 * @throws Will throw an error if the wallet is not connected.
 */
export function validateWallet(account: Address) {
    if (!account) {
        throw new Error(`Wallet not connected`);
    }
}

/**
 * Retrieves the chain ID for a given EVM chain name.
 *
 * @param chainName - The name of the EVM chain.
 * @returns The corresponding chain ID.
 * @throws Will throw an error if the chain name is unsupported or if BetSwirl doesn't support the chain.
 */
export function getChainId(chainName: EvmChain) {
    const chainId = EVM.utils.getChainFromName(chainName as EvmChain) as CasinoChainId;
    if (!chainId) {
        throw new Error(`Unsupported chain name: ${chainName}`);
    }
    if (!casinoChainIds.includes(chainId)) {
        throw new Error(`BetSwirl doesn't support ${chainName}`);
    }
    return chainId;
}

/**
 * Checks if the given account has enough balance of the specified token.
 *
 * @param provider - The public client used to fetch the balance.
 * @param token - The token for which the balance is being checked.
 * @param account - The address of the account to check the balance of.
 * @param required - The required balance amount in the smallest unit of the token.
 * @throws Will throw an error if the account balance is less than the required amount.
 */
export async function hasEnoughBalance(provider: PublicClient, token: Token, account: Address, required: bigint) {
    const balance = await provider.getBalance({
        address: account,
    });
    if (balance < required) {
        throw new Error(`Not enough funds, ${formatRawAmount(required, token.decimals)} ${token.symbol} required`);
    }
}

export interface CommonProps {
    chainName: EvmChain;
    account: Address;
    tokenSymbol: string;
    betAmount: string;
}

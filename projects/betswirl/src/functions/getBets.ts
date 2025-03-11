import { EvmChain, FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { Address } from 'viem';
import { formatTxnUrl, getBetSwirlBetUrl, initViemBetSwirlClient, slugById } from '@betswirl/sdk-core';
import { validateWallet, getChainId } from '../utils';

interface Props {
    chainName: EvmChain;
    account: Address;
}

/**
 * Retrieves the last 5 bets for a given account on a specified blockchain.
 *
 * @param {Object} params - The parameters for the function.
 * @param {string} params.chainName - The name of the blockchain chain.
 * @param {string} params.account - The account address to retrieve bets for.
 * @param {Object} options - The options for the function.
 * @param {Function} options.evm.getProvider - Function to get the provider for the specified chain.
 * @param {Function} options.notify - Function to send notifications.
 * @returns {Promise<FunctionReturn>} A promise that resolves to the result of the function.
 * @throws Will throw an error if there is an issue fetching the bets.
 */
export async function getBets({ chainName, account }: Props, options: FunctionOptions): Promise<FunctionReturn> {
    const {
        evm: { getProvider },
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
        // Validate the account
        validateWallet(account);

        await notify('Retrieving the bet...');
        const bets = await betswirlClient.fetchBets(
            chainId,
            {
                bettor: account,
            },
            undefined,
            5
        );
        if (bets.error) {
            throw new Error(`[${bets.error.code}] Error fetching bets: ${bets.error.message}`);
        }
        return toResult(
            JSON.stringify({
                message: `Last 5 bets. Visit your profile here: https://www.betswirl.com/${slugById[chainId]}/profile/${account}/casino.`,
                bets: bets.bets.map((bet) => ({
                    id: String(bet.id),
                    input: bet.decodedInput,
                    betTxnHash: bet.betTxnHash,
                    betTxnLink: formatTxnUrl(bet.betTxnHash, chainId),
                    betAmount: bet.formattedBetAmount,
                    token: bet.token.symbol,
                    isWin: bet.isWin,
                    payoutMultiplier: bet.formattedPayoutMultiplier,
                    rolled: bet.decodedRolled,
                    payout: bet.formattedPayout,
                    rollTxnHash: bet.rollTxnHash,
                    rollTxnLink: bet.rollTxnHash ? formatTxnUrl(bet.rollTxnHash, chainId) : null,
                    linkOnBetSwirl: getBetSwirlBetUrl(bet.id, bet.game, chainId),
                })),
            })
        );
    } catch (error) {
        return toResult(error instanceof Error ? error.message : 'Unknown error', true);
    }
}

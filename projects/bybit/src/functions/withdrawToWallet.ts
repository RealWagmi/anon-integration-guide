import { FunctionReturn, toResult } from '@heyanon/sdk';
import { FunctionOptionsWithExchange } from '../overrides';
import { getUserBalance, withdraw } from '../helpers/account';

interface Props {
    currency: string;
    chain: string;
    amount: number;
    walletAddress: string;
    tag: string | null;
}

/**
 * Withdraw funds from the user's funding account to an on-chain wallet address.
 *
 * @param props - The function input parameters
 * @param props.currency - The currency to withdraw
 * @param props.chain - The chain to withdraw to
 * @param props.amount - The amount to withdraw
 * @param props.walletAddress - The wallet address to withdraw to
 * @param props.tag - The tag to include in the withdrawal request (optional)
 * @param options HeyAnon SDK options
 * @returns A message with the result of the operation
 */
export async function withdrawToWallet({ currency, chain, amount, walletAddress, tag }: Props, { exchange, notify }: FunctionOptionsWithExchange): Promise<FunctionReturn> {
    try {
        // Sanitize the input
        const sanitizedCurrency = currency.toUpperCase();
        let sanitizedChain = chain?.toUpperCase();
        // Special case for ETH, which is supported as ERC20
        if (sanitizedChain === 'ETH' || sanitizedChain === 'ETHEREUM') {
            sanitizedChain = 'ERC20';
        }
        // Check that the user has enough funds to withdraw
        const balance = await getUserBalance(exchange, 'funding');
        if (!balance[sanitizedCurrency]?.total || balance[sanitizedCurrency].total < amount) {
            return toResult(
                `Error withdrawing funds to '${walletAddress}': insufficient balance.  You have ${balance[sanitizedCurrency]?.total ?? 0} ${sanitizedCurrency} in your funding account.`,
                true,
            );
        }
        // Get supported withdrawal chains for the given currency
        const currencies = await exchange.fetchCurrencies();
        const currencyObject = currencies[sanitizedCurrency];
        if (!currencyObject) {
            return toResult(`Currency ${sanitizedChain} not found, please check the currency name and try again`, true);
        }
        const supportedChainsForCurrency = Object.keys(currencyObject.networks);
        // Filter chains: keep chains with "active: true" and "withdraw: true"
        const activeChainsForCurrency = supportedChainsForCurrency.filter((sanitizedChain) => {
            const network = currencyObject.networks[sanitizedChain as keyof typeof currencyObject.networks];
            return network.active && network.withdraw;
        });
        // If no chain supports the currency, return an error
        if (activeChainsForCurrency.length === 0) {
            return toResult(`Currency ${sanitizedCurrency} cannot currently be withdrawn to ${exchange.name}`, true);
        }
        // If no chain is specified, try to infer it from the currency, otherwise
        // ask the user to specify one from the list
        if (!sanitizedChain) {
            if (activeChainsForCurrency.length === 1) {
                // If there is only one active chain, use it
                notify(`Assuming withdrawal chain is ${activeChainsForCurrency[0]} (the only one...`);
                sanitizedChain = activeChainsForCurrency[0];
            } else if (activeChainsForCurrency.includes(sanitizedCurrency)) {
                // Try to infer the chain from the currency, e.g. if currency is BTC, the chain is BTC
                notify(`Assuming withdrawal chain is ${sanitizedCurrency}...`);
                sanitizedChain = sanitizedCurrency;
            } else {
                return toResult(`Please specify the chain you will be withdrawing ${sanitizedCurrency} to. Supported chains are: ${activeChainsForCurrency.join(', ')}`);
            }
        }
        // If the chain is specified, but isn't supported, ask the user to specify one from the list
        if (!activeChainsForCurrency.includes(sanitizedChain)) {
            return toResult(
                `Bybit does not support withdrawing token ${sanitizedCurrency} to chain ${sanitizedChain}. Supported chains for token ${sanitizedCurrency} are: ${activeChainsForCurrency.join(', ')}`,
                true,
            );
        }
        const currencyNetwork = currencyObject.networks[sanitizedChain as keyof typeof currencyObject.networks];
        // Show the token address on the destination chain to the user
        if (currencyNetwork?.info?.contractAddress) {
            notify(`Token address on ${sanitizedChain} chain: ${currencyNetwork.info.contractAddress}`);
        }
        // Build the withdrawal request
        const bybitSpecificParams = {
            accountType: 'FUND',
            forceChain: 1,
        };
        // Withdraw the funds
        const transaction = await withdraw(exchange, sanitizedCurrency, sanitizedChain, amount, walletAddress, tag ?? undefined, bybitSpecificParams);
        return toResult(`Withdrawal request created with ID ${transaction.id}`);
    } catch (error) {
        if (
            error instanceof Error &&
            (error.message.includes('Withdraw address chain or destination tag are not equal') || error.message.includes('ensure the address is whitelisted'))
        ) {
            return toResult(
                `Error withdrawing funds to '${walletAddress}': did you whitelist the address ${walletAddress} on Bybit for the ${currency} token on ${chain} chain?  Please note that wallet addresses are case-sensitive. Full error: ${error}`,
                true,
            );
        }
        return toResult(`Error withdrawing funds to '${walletAddress}': ${error}`, true);
    }
}

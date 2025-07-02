import { FunctionReturn, toResult } from '@heyanon/sdk';
import { FunctionOptionsWithExchange } from '../overrides';
import { getUserDepositAddress as getUserDepositAddressHelper } from '../helpers/account';

interface Props {
    currency: string;
    chain: string | null;
}

/**
 * Get the user deposit address for a given currency and network.
 *
 * @param props - The function input parameters
 * @param props.currency - The currency to get the deposit address for, e.g. BTC or USDT
 * @param props.chain - The chain to get the deposit address for, e.g. BTC or ERC20
 * @param options HeyAnon SDK options
 * @returns A message with the result of the operation
 */
export async function getUserDepositAddress({ currency, chain }: Props, { exchange, notify }: FunctionOptionsWithExchange): Promise<FunctionReturn> {
    try {
        // Sanitize the input
        const sanitizedCurrency = currency.toUpperCase();
        let sanitizedChain = chain?.toUpperCase();
        // Special case for ETH, which is supported on Bybit as ERC20
        if (sanitizedChain === 'ETH' || sanitizedChain === 'ETHEREUM') {
            notify(`Using ERC20 as deposit chain (same as ${sanitizedChain} on Bybit)...`);
            sanitizedChain = 'ERC20';
        }
        // Get supported deposit chains for the given currency
        const currencies = await exchange.fetchCurrencies();
        const currencyObject = currencies[sanitizedCurrency];
        if (!currencyObject) {
            return toResult(`Currency ${sanitizedChain} not found, please check the currency name and try again`, true);
        }
        const supportedChainsForCurrency = Object.keys(currencyObject.networks);
        // Filter chains: keep chains with "active: true" and "deposit: true"
        const activeChainsForCurrency = supportedChainsForCurrency.filter((sanitizedChain) => {
            const network = currencyObject.networks[sanitizedChain as keyof typeof currencyObject.networks];
            return network.active && network.deposit;
        });
        // If no chain supports the currency, return an error
        if (activeChainsForCurrency.length === 0) {
            return toResult(`Currency ${sanitizedCurrency} cannot currently be deposited to ${exchange.name}`, true);
        }
        // If no chain is specified, try to infer it from the currency, otherwise
        // ask the user to specify one from the list
        if (!sanitizedChain) {
            if (activeChainsForCurrency.length === 1) {
                // If there is only one active chain, use it
                notify(`Assuming deposit chain is ${activeChainsForCurrency[0]} (the only...`);
                sanitizedChain = activeChainsForCurrency[0];
            } else if (activeChainsForCurrency.includes(sanitizedCurrency)) {
                // Try to infer the chain from the currency, e.g. if currency is BTC, the chain is BTC
                notify(`Assuming deposit chain is ${sanitizedCurrency}...`);
                sanitizedChain = sanitizedCurrency;
            } else {
                return toResult(`Please specify the chain you will be depositing ${sanitizedCurrency} from. Supported chains are: ${activeChainsForCurrency.join(', ')}`);
            }
        }
        // If the chain is specified, but isn't supported, ask the user to specify one from the list
        if (!activeChainsForCurrency.includes(sanitizedChain)) {
            return toResult(
                `Bybit does not support depositing token ${sanitizedCurrency} on chain ${sanitizedChain}. Supported chains for token ${sanitizedCurrency} are: ${activeChainsForCurrency.join(', ')}`,
                true,
            );
        }
        const currencyNetwork = currencyObject.networks[sanitizedChain as keyof typeof currencyObject.networks];
        // Get the first 6 digits of the token address
        let tokenAddressString = '';
        if (currencyNetwork?.info?.contractAddress) {
            tokenAddressString = ` [${currencyNetwork.info.contractAddress.slice(0, 6)}...]`;
        }
        // Get the deposit address
        const depositAddressStructure = await getUserDepositAddressHelper(exchange, sanitizedCurrency, sanitizedChain);
        let outputString = `Your deposit address for token ${sanitizedCurrency}${tokenAddressString} on chain ${sanitizedChain} is ${depositAddressStructure.address}`;
        if (depositAddressStructure.tag) {
            outputString += `\nThe chain tag / memo / paymentId is: ${depositAddressStructure.tag}`;
        }
        return toResult(outputString);
    } catch (error) {
        return toResult(`Error getting deposit address: ${error}`, true);
    }
}

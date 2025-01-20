import { FunctionOptions, FunctionReturn, TransactionParams, getChainFromName, toResult } from '@heyanon/sdk';
import { Address, encodeFunctionData } from 'viem';
import comptrollerAbi from '../abis/comptroller';
import { COMPTROLLER_ADDRESS, QI_MARKETS, type QiMarketName, supportedChains } from '../constants';

interface Props {
    chainName: string;
    account: Address;
    marketNames: QiMarketName[];
}

/**
 * Enters a list of markets on the specified chain for the given account.
 * @param props - The function `Props`
 * @param tools - System tools for blockchain interactions
 * @returns Transaction result
 */
export async function enterMarkets({ chainName, account, marketNames }: Props, { sendTransactions, notify }: FunctionOptions): Promise<FunctionReturn> {
    // Check wallet connection
    if (!account) return toResult('Wallet not connected', true);

    // Validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Protocol is not supported on ${chainName}`, true);

    // Validate markets
    if (!Array.isArray(marketNames)) return toResult('Market names must be an array', true);

    if (marketNames.length === 0) return toResult('Please provide at least one market name', true);

    const marketAddresses = Array.from(new Set(marketNames.map((marketName) => QI_MARKETS[marketName])));

    if (marketAddresses.some((marketAddress) => typeof marketAddress !== 'string')) return toResult('Invalid market name specified', true);

    const transactions: TransactionParams[] = [];

    // Underlying asset
    await notify(`Preparing to enter ${marketAddresses.length} markets...`);

    const tx: TransactionParams = {
        target: COMPTROLLER_ADDRESS,
        data: encodeFunctionData({
            abi: comptrollerAbi,
            functionName: 'enterMarkets',
            args: [marketAddresses],
        }),
    };

    transactions.push(tx);

    await notify('Waiting for transaction confirmation...');

    // Sign and send transaction
    const result = await sendTransactions({ chainId, account, transactions });
    const message = result.data[result.data.length - 1];

    return toResult(result.isMultisig ? message.message : `Successfully enter ${marketAddresses.length} markets. ${message.message}`);
}

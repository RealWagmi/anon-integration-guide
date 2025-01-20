import { FunctionOptions, FunctionReturn, TransactionParams, getChainFromName, toResult } from '@heyanon/sdk';
import { Address, encodeFunctionData, parseUnits } from 'viem';
import qiAvaxAbi from '../abis/qiAvax';
import qiERC20Abi from '../abis/qiERC20';
import { QI_AVAX_NAME, QI_MARKETS, QI_MARKETS_DECIMALS, type QiMarketName, supportedChains } from '../constants';

interface Props {
    chainName: string;
    account: Address;
    amount: string;
    marketName: QiMarketName;
}

/**
 * Borrows specified amount of tokens against previously set collateral
 * @param props - The function `Props`
 * @param tools - System tools for blockchain interactions
 * @returns Transaction result
 */
export async function borrow({ chainName, account, amount: maybeAmount, marketName }: Props, { sendTransactions, notify }: FunctionOptions): Promise<FunctionReturn> {
    // Check wallet connection
    if (!account) return toResult('Wallet not connected', true);

    // Validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Protocol is not supported on ${chainName}`, true);

    // Validate amount
    if (!maybeAmount || typeof maybeAmount !== 'string') return toResult('Amount must be a string', true);

    const amount = parseUnits(maybeAmount, QI_MARKETS_DECIMALS);
    if (amount === 0n) return toResult('Amount must be greater than 0', true);

    // Validate market
    if (!marketName || !QI_MARKETS[marketName]) return toResult('Incorrect market specified', true);

    const marketAddress = QI_MARKETS[marketName];
    const transactions: TransactionParams[] = [];

    // Handle qiAVAX differently as it's not ERC-20 based
    if (marketName === QI_AVAX_NAME) {
        await notify('Preparing borrow transaction...');

        const tx: TransactionParams = {
            target: marketAddress,
            data: encodeFunctionData({
                abi: qiAvaxAbi,
                functionName: 'borrow',
                args: [amount],
            }),
        };

        transactions.push(tx);
    } else {
        await notify('Preparing borrow transaction...');

        const tx: TransactionParams = {
            target: marketAddress,
            data: encodeFunctionData({
                abi: qiERC20Abi,
                functionName: 'borrow',
                args: [amount],
            }),
        };

        transactions.push(tx);
    }

    await notify('Waiting for transaction confirmation...');

    // Sign and send transaction
    const result = await sendTransactions({ chainId, account, transactions });
    const message = result.data[result.data.length - 1];

    return toResult(result.isMultisig ? message.message : `Successfully borrowed ${amount} tokens. ${message.message}`);
}

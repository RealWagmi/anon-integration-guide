import { FunctionOptions, FunctionReturn, TransactionParams, getChainFromName, toResult } from '@heyanon/sdk';
import { Address, encodeFunctionData, parseUnits } from 'viem';
import qiAvaxAbi from '../abis/qiAvax';
import { QI_AVAX_ADDRESS, QI_MARKETS_DECIMALS, supportedChains } from '../constants';

interface Props {
    chainName: string;
    account: Address;
    amount: string;
}

/**
 * Example function that demonstrates protocol interaction pattern.
 * @param props - The function `Props`
 * @param tools - System tools for blockchain interactions
 * @returns Transaction result
 */
export async function depositCollateralAvax({ chainName, account, amount: maybeAmount }: Props, { sendTransactions, notify }: FunctionOptions): Promise<FunctionReturn> {
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
    const transactions: TransactionParams[] = [];

    await notify('Preparing mint transaction...');

    const tx: TransactionParams = {
        target: QI_AVAX_ADDRESS,
        data: encodeFunctionData({
            abi: qiAvaxAbi,
            functionName: 'mint',
            args: [],
        }),
        value: amount,
    };

    transactions.push(tx);

    await notify('Waiting for transaction confirmation...');

    // Sign and send transaction
    const result = await sendTransactions({ chainId, account, transactions });
    const message = result.data[result.data.length - 1];

    return toResult(result.isMultisig ? message.message : `Successfully deposited collateral of ${amount} tokens. ${message.message}`);
}

import { Address, parseUnits } from 'viem';
import { FunctionReturn, FunctionOptions, TransactionParams, toResult, getChainFromName, checkToApprove } from '@heyanon/sdk';
import { supportedChains, chainIdToNetworkNameMap } from '../constants';
import { getQuote, getToken, getTransaction } from '../utils';

interface Props {
    chainName: string;
    fromTokenAddress: Address;
    toTokenAddress: Address;
    amount: string;
    slippage?: number;
    account: Address;
    toAddress: Address;
}

export async function swap({ chainName, fromTokenAddress, toTokenAddress, amount, slippage, account, toAddress }: Props, helpers: FunctionOptions): Promise<FunctionReturn> {
    const { sendTransactions, notify, getProvider } = helpers;
    if (!account) {
        return toResult('Wallet is not connected', true);
    }
    const chainId = getChainFromName(chainName);
    if (!chainId) {
        return toResult(`Unsupported chain name: ${chainName}`, true);
    }
    if (!supportedChains.includes(chainId)) {
        return toResult(`Magpie protocol is not supported on ${chainName}`, true);
    }
    const networkName = chainIdToNetworkNameMap.get(chainId);
    if (!networkName) {
        return toResult(`Magpie network is not mapped for ${chainName}`, true);
    }
    if (!fromTokenAddress) {
        return toResult('From token address is not specified', true);
    }
    if (!toTokenAddress) {
        return toResult('To token address is not specified', true);
    }

    const [{ result: fromTokenResult, token: fromToken }, { result: toTokenResult, token: toToken }] = await Promise.all([
        getToken({ chainName, address: fromTokenAddress }, helpers),
        getToken({ chainName, address: toTokenAddress }, helpers),
    ]);

    if (fromTokenResult) {
        return fromTokenResult;
    }

    if (toTokenResult) {
        return toTokenResult;
    }

    if (!fromToken) {
        return toResult('From token is not supported', true);
    }

    if (!toToken) {
        return toResult('To token is not supported', true);
    }

    const amountInWei = parseUnits(amount, fromToken.decimals);
    if (amountInWei === 0n) {
        return toResult('Amount must be greater than 0', true);
    }

    slippage = slippage || 0.005;

    if (slippage <= 0 || slippage >= 1) {
        return toResult('Slippage must be between 0 and 1', true);
    }

    if (!toAddress) {
        return toResult('To address is not specified', true);
    }

    const { quote, result: quoteResult } = await getQuote(
        {
            chainName,
            fromToken,
            toToken,
            amount,
            slippage,
            fromAddress: account,
            toAddress,
        },
        helpers,
    );

    if (quoteResult) {
        return quoteResult;
    }

    if (!quote?.id) {
        return toResult("Couldn't get quote", true);
    }

    const provider = getProvider(chainId);
    const transactions: TransactionParams[] = [];

    await checkToApprove({
        args: {
            account,
            target: quote.targetAddress,
            spender: account,
            amount: amountInWei,
        },
        provider,
        transactions,
    });

    const { transaction, result: transactionResult } = await getTransaction(
        {
            quoteId: quote.id,
        },
        helpers,
    );

    if (transactionResult) {
        return transactionResult;
    }

    if (!transaction) {
        return toResult("Couldn't get transaction data", true);
    }

    const tx: TransactionParams = {
        target: quote.targetAddress,
        data: transaction.data,
        value: BigInt(transaction.value),
    };
    transactions.push(tx);

    await notify('Waiting for transaction confirmation...');

    const result = await sendTransactions({ chainId, account, transactions });
    const depositMessage = result.data[result.data.length - 1];

    return toResult(result.isMultisig ? depositMessage.message : `Successfully swapped ${amount} ${fromToken.symbol} to ${toToken.symbol}. ${depositMessage.message}`);
}

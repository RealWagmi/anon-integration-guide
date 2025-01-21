import { Address, parseUnits } from 'viem';
import { FunctionReturn, FunctionOptions, TransactionParams, toResult, getChainFromName, checkToApprove } from '@heyanon/sdk';
import { supportedChains } from '../constants';
import { SupportedChainId, OrderKind, TradeParameters, TradingSdk } from '@cowprotocol/cow-sdk';

interface Props {
    chainName: string;
    account: Address;
    amount: string;
    receiver?: Address;

    sellToken: Address;
    buyToken: Address;
}

/**
 * Example function that demonstrates protocol interaction pattern.
 * @param props - The function parameters

 * @param tools - System tools for blockchain interactions
 * @returns Transaction result
 */
export async function swapToken({ chainName, account, amount }: Props, { sendTransactions, notify, getProvider }: FunctionOptions): Promise<FunctionReturn> {
    // Check wallet connection
    if (!account) return toResult('Wallet not connected', true);

    // Validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Protocol is not supported on ${chainName}`, true);

    // Validate amount
    const amountInWei = parseUnits(amount, 18);
    if (amountInWei === 0n) return toResult('Amount must be greater than 0', true);

    await notify('Preparing example transaction...');

    const provider = getProvider(chainId);

    // Initialize the SDK
    const sdk = new TradingSdk({
        chainId: chainId.valueOf(),
        signer: provider,
        appCode: 'HeyAnon',
    });

    const parameters: TradeParameters = {
        kind: OrderKind.BUY,
        sellToken: '0xfff9976782d46cc05630d1f6ebab18b2324d6b14',
        sellTokenDecimals: 18,
        buyToken: '0x0625afb445c3b6b7b929342a04a22599fd5dbb59',
        buyTokenDecimals: 18,
        amount: '120000000000000000',
    };

    const transactions: TransactionParams[] = [];

    // Example transaction
    const tx: TransactionParams = {
        target: '0x...', // Protocol contract address
        data: '0x...', // Encoded function call
    };
    transactions.push(tx);

    await notify('Waiting for transaction confirmation...');

    // Sign and send transaction
    const result = await sendTransactions({ chainId, account, transactions });
    const message = result.data[result.data.length - 1];

    return toResult(result.isMultisig ? message.message : `Successfully executed example with ${amount} tokens. ${message.message}`);
}

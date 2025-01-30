import { FunctionOptions, FunctionReturn, TransactionParams, toResult } from '@heyanon/sdk';
import { Address, encodeFunctionData } from 'viem';
import comptrollerAbi from '../abis/comptroller';
import { CORE_COMPTROLLER_ADDRESS, ECOSYSTEM_UNITROLLER_ADDRESS, MarketProps } from '../constants';
import { parseMarket, parseWallet } from '../utils';

type Props = MarketProps & {
    chainName: string;
    account: Address;
};

/**
 * Exit market on the specified chain for the given account.
 * @param props - The function {@link Props}
 * @param tools - System tools for blockchain interactions
 * @returns Transaction result
 */
export async function exitMarket(props: Props, { sendTransactions, notify }: FunctionOptions): Promise<FunctionReturn> {
    const wallet = parseWallet(props);

    if (!wallet.success) {
        return toResult(wallet.errorMessage, true);
    }

    const { account, chainId } = wallet.data;

    const market = parseMarket(props);

    if (!market.success) {
        return toResult(market.errorMessage, true);
    }

    const transactions: TransactionParams[] = [];

    await notify(`Preparing to exit ${market.data.marketName} market...`);

    const tx: TransactionParams = {
        target: market.data.marketType === 'core' ? CORE_COMPTROLLER_ADDRESS : ECOSYSTEM_UNITROLLER_ADDRESS,
        data: encodeFunctionData({
            abi: comptrollerAbi,
            functionName: 'exitMarket',
            args: [market.data.marketAddress],
        }),
    };

    transactions.push(tx);

    await notify('Waiting for transaction confirmation...');

    // Sign and send transaction
    const result = await sendTransactions({ chainId, account, transactions });
    const message = result.data[result.data.length - 1];

    return toResult(result.isMultisig ? message.message : `Successfully exited ${market.data.marketAddress} market. ${message.message}`);
}

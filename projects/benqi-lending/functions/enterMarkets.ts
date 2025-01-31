import { FunctionOptions, FunctionReturn, TransactionParams, toResult } from '@heyanon/sdk';
import { Address, encodeFunctionData } from 'viem';
import comptrollerAbi from '../abis/comptroller';
import { CORE_COMPTROLLER_ADDRESS, ECOSYSTEM_UNITROLLER_ADDRESS, MarketListProps } from '../constants';
import { parseMarketList, parseWallet } from '../utils/parse';

type Props = MarketListProps & {
    chainName: string;
    account: Address;
};

/**
 * Enters a list of markets on the specified chain for the given account.
 * @param props - The function {@link Props}
 * @param tools - System tools for blockchain interactions
 * @returns Transaction result
 */
export async function enterMarkets(props: Props, { sendTransactions, notify }: FunctionOptions): Promise<FunctionReturn> {
    const wallet = parseWallet(props);

    if (!wallet.success) {
        return toResult(wallet.errorMessage, true);
    }

    const { account, chainId } = wallet.data;

    const marketList = parseMarketList(props);

    if (!marketList.success) {
        return toResult(marketList.errorMessage, true);
    }

    const transactions: TransactionParams[] = [];

    await notify(`Preparing to enter ${marketList.data.marketNames.length} markets...`);

    const tx: TransactionParams = {
        target: marketList.data.marketType === 'core' ? CORE_COMPTROLLER_ADDRESS : ECOSYSTEM_UNITROLLER_ADDRESS,
        data: encodeFunctionData({
            abi: comptrollerAbi,
            functionName: 'enterMarkets',
            args: [marketList.data.marketAddresses],
        }),
    };

    transactions.push(tx);

    await notify('Waiting for transaction confirmation...');

    // Sign and send transaction
    const result = await sendTransactions({ chainId, account, transactions });
    const message = result.data[result.data.length - 1];

    return toResult(result.isMultisig ? message.message : `Successfully enter ${marketList.data.marketAddresses.length} markets. ${message.message}`);
}

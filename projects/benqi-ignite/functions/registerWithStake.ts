import { checkToApprove, FunctionOptions, FunctionReturn, toResult, TransactionParams } from '@heyanon/sdk';
import { Address, encodeFunctionData, formatUnits } from 'viem';
import eacAggregatorProxyAbi from '../abis/eacAggregatorProxy';
import igniteAbi from '../abis/ignite';
import { AVAX_DECIMALS, AVAX_PRICE_FEED_KEY, ERC20_PAYMENT_METHODS, IGNITE_ADDRESS, QI_DECIMALS, RegisterProps, STAKE_LIMIT_IN_AVAX, VALIDATION_DURATION_TIME } from '../constants';
import { checkBalance } from '../utils/checkBalance';
import { checkERC20Balance } from '../utils/checkERC20Balance';
import { parseAmount, parseRegister, parseWallet } from '../utils/parse';

type Props = RegisterProps & {
    chainName: string;
    account: Address;
    /**
     * amount of AVAX tokens user wants to stake. Default limit is between 500 and 1800
     */
    amount: string;
};

/**
 * Register nodeId with staking fee.
 * @param props - The function {@link Props}
 * @param tools - System tools for blockchain interactions
 * @returns Transaction result
 */
export async function registerWithStake(props: Props, { sendTransactions, notify, getProvider }: FunctionOptions): Promise<FunctionReturn> {
    const wallet = parseWallet(props);

    if (!wallet.success) {
        return toResult(wallet.errorMessage, true);
    }

    const { account, chainId } = wallet.data;

    const amount = parseAmount({ ...props, decimals: AVAX_DECIMALS });

    if (!amount.success) {
        return toResult(amount.errorMessage, true);
    }

    const register = parseRegister(props);

    if (!register.success) {
        return toResult(register.errorMessage, true);
    }

    const qiAddress = ERC20_PAYMENT_METHODS.Qi;

    const transactions: TransactionParams[] = [];
    const provider = getProvider(chainId);
    const time = VALIDATION_DURATION_TIME[register.data.validationDuration];

    await notify('Checking if provided AVAX amount is between min and max deposit...');

    const [minimumAvaxDeposit, maximumAvaxDeposit] = await provider.multicall({
        contracts: [
            {
                address: IGNITE_ADDRESS,
                abi: igniteAbi,
                functionName: 'minimumAvaxDeposit',
                args: [],
            },
            {
                address: IGNITE_ADDRESS,
                abi: igniteAbi,
                functionName: 'maximumAvaxDeposit',
                args: [],
            },
        ],
    });

    if (minimumAvaxDeposit.status !== 'success') return toResult(minimumAvaxDeposit.error.message, true);

    if (maximumAvaxDeposit.status !== 'success') return toResult(maximumAvaxDeposit.error.message, true);

    if (amount.data < minimumAvaxDeposit.result || amount.data > maximumAvaxDeposit.result) {
        return toResult(`Amount must be between ${formatUnits(minimumAvaxDeposit.result, AVAX_DECIMALS)} and ${formatUnits(maximumAvaxDeposit.result, AVAX_DECIMALS)}`, true);
    }

    await notify('Fetching price feed contracts addresses...');

    const [qiPriceFeed, avaxPriceFeed] = await provider.multicall({
        contracts: [
            {
                address: IGNITE_ADDRESS,
                abi: igniteAbi,
                functionName: 'priceFeeds',
                args: [qiAddress],
            },
            {
                address: IGNITE_ADDRESS,
                abi: igniteAbi,
                functionName: 'priceFeeds',
                args: [AVAX_PRICE_FEED_KEY],
            },
        ],
    });

    if (qiPriceFeed.status !== 'success') return toResult(qiPriceFeed.error.message, true);

    if (avaxPriceFeed.status !== 'success') return toResult(avaxPriceFeed.error.message, true);

    await notify('Fetching latest prices from feeds...');

    const [qiLatestRound, avaxLatestRound] = await provider.multicall({
        contracts: [
            {
                address: qiPriceFeed.result,
                abi: eacAggregatorProxyAbi,
                functionName: 'latestRoundData',
                args: [],
            },
            {
                address: avaxPriceFeed.result,
                abi: eacAggregatorProxyAbi,
                functionName: 'latestRoundData',
                args: [],
            },
        ],
    });

    if (qiLatestRound.status !== 'success') return toResult(qiLatestRound.error.message, true);

    if (avaxLatestRound.status !== 'success') return toResult(avaxLatestRound.error.message, true);

    await notify('Calculating fee in Qi...');

    const avaxPrice = avaxLatestRound.result[1];
    const qiPrice = qiLatestRound.result[1];

    // QI deposit amount is 10 % (thus, note the divider) of the AVAX value
    // that BENQI subsidises for the validator.
    let qiAmount = (avaxPrice * (STAKE_LIMIT_IN_AVAX - amount.data)) / qiPrice / 10n;

    await notify('Increasing allowance by 10% to avoid reverts due to last minute price changes...');

    qiAmount = (qiAmount * 110n) / 100n;

    try {
        await notify(`Verifying Qi balance...`);

        await checkERC20Balance({
            args: {
                token: qiAddress,
                account,
                amount: qiAmount,
                decimals: QI_DECIMALS,
            },
            provider,
        });
    } catch (error: unknown) {
        if (error instanceof Error) {
            return toResult(error.message, true);
        }

        return toResult('Unknown error', true);
    }

    try {
        await notify(`Verifying AVAX balance...`);

        await checkBalance({
            args: {
                account,
                amount: amount.data,
                decimals: AVAX_DECIMALS,
            },
            provider,
        });
    } catch (error: unknown) {
        if (error instanceof Error) {
            return toResult(error.message, true);
        }

        return toResult('Unknown error', true);
    }

    await checkToApprove({
        args: {
            account,
            target: qiAddress,
            spender: IGNITE_ADDRESS,
            amount: qiAmount,
        },
        transactions,
        provider,
    });

    await notify('Preparing registerWithStake transaction...');

    const tx: TransactionParams = {
        target: IGNITE_ADDRESS,
        data: encodeFunctionData({
            abi: igniteAbi,
            functionName: 'registerWithStake',
            args: [register.data.nodeId, register.data.blsProofOfPossession, time],
        }),
        value: amount.data,
    };

    transactions.push(tx);

    await notify('Waiting for transaction confirmation...');

    // Sign and send transaction
    const result = await sendTransactions({ chainId, account, transactions });
    const message = result.data[result.data.length - 1];

    return toResult(result.isMultisig ? message.message : `Successfully registered node ${register.data.nodeId} with stake. ${message.message}`);
}

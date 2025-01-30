import { checkToApprove, FunctionOptions, FunctionReturn, toResult, TransactionParams } from '@heyanon/sdk';
import { Address, encodeFunctionData, erc20Abi } from 'viem';
import eacAggregatorProxyAbi from '../abis/eacAggregatorProxy';
import igniteAbi from '../abis/ignite';
import {
    AVAX_ADDRESS,
    AVAX_DECIMALS,
    AVAX_REGISTRATION_FEE,
    ERC20_PAYMENT_METHODS,
    ERC20PaymentMethod,
    IGNITE_ADDRESS,
    RegisterProps,
    VALIDATION_DURATION_TIME,
} from '../constants';
import { parseRegister, parseWallet } from '../utils';

type Props = RegisterProps & {
    chainName: string;
    account: Address;
    paymentMethod: ERC20PaymentMethod;
};

/**
 * Register nodeId with fee paid in ERC20 based currency.
 * @param props - The function {@link Props}
 * @param tools - System tools for blockchain interactions
 * @returns Transaction result
 */
export async function registerWithErc20Fee(props: Props, { sendTransactions, notify, getProvider }: FunctionOptions): Promise<FunctionReturn> {
    const wallet = parseWallet(props);

    if (!wallet.success) {
        return toResult(wallet.errorMessage, true);
    }

    const { account, chainId } = wallet.data;

    const register = parseRegister(props);

    if (!register.success) {
        return toResult(register.errorMessage, true);
    }

    const paymentMethodAddress = ERC20_PAYMENT_METHODS[props.paymentMethod];

    if (!paymentMethodAddress) {
        return toResult(`Payment method ${props.paymentMethod} is not supported`, true);
    }

    const transactions: TransactionParams[] = [];
    const provider = getProvider(chainId);
    const time = VALIDATION_DURATION_TIME[register.data.validationDuration];

    await notify('Started estimating fee for registerWithErc20Fee transaction...');

    await notify('Fetching price feed contracts addresses...');

    const [paymentMethodPriceFeed, avaxPriceFeed] = await provider.multicall({
        contracts: [
            {
                address: IGNITE_ADDRESS,
                abi: igniteAbi,
                functionName: 'priceFeeds',
                args: [paymentMethodAddress],
            },
            {
                address: IGNITE_ADDRESS,
                abi: igniteAbi,
                functionName: 'priceFeeds',
                args: [AVAX_ADDRESS],
            },
        ],
    });

    if (paymentMethodPriceFeed.status !== 'success') return toResult(paymentMethodPriceFeed.error.message, true);

    if (avaxPriceFeed.status !== 'success') return toResult(avaxPriceFeed.error.message, true);

    await notify('Fetching latest prices from feeds...');

    const [paymentMethodLatestRound, avaxLatestRound, paymentMethodDecimals] = await provider.multicall({
        contracts: [
            {
                address: paymentMethodPriceFeed.result,
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
            {
                address: paymentMethodAddress,
                abi: erc20Abi,
                functionName: 'decimals',
                args: [],
            },
        ],
    });

    if (paymentMethodLatestRound.status !== 'success') return toResult(paymentMethodLatestRound.error.message, true);

    if (avaxLatestRound.status !== 'success') return toResult(avaxLatestRound.error.message, true);

    if (paymentMethodDecimals.status !== 'success') return toResult(paymentMethodDecimals.error.message, true);

    await notify('Calculating fee...');

    const feeInAvax = AVAX_REGISTRATION_FEE[register.data.validationDuration];
    const avaxPrice = avaxLatestRound.result[1];
    const tokenPrice = paymentMethodLatestRound.result[1];

    let tokenAmount = (avaxPrice * feeInAvax) / tokenPrice / 10n ** BigInt(AVAX_DECIMALS - paymentMethodDecimals.result);

    if (paymentMethodAddress === ERC20_PAYMENT_METHODS.Qi) {
        await notify('Applying Qi price multiplier...');

        const qiPriceMultiplier = await provider.readContract({
            address: IGNITE_ADDRESS,
            abi: igniteAbi,
            functionName: 'qiPriceMultiplier',
            args: [],
        });

        // 10_000 is a hardcoded value in Ignite contract
        tokenAmount = (tokenAmount * qiPriceMultiplier) / 10_000n;
    }

    await notify('Increasing allowance by 10% to avoid reverts due to last minute price changes...');

    tokenAmount = (tokenAmount * 110n) / 100n;

    await checkToApprove({
        args: {
            account,
            target: paymentMethodAddress,
            spender: IGNITE_ADDRESS,
            amount: tokenAmount,
        },
        transactions,
        provider,
    });

    await notify('Preparing registerWithAvaxFee transaction...');

    const tx: TransactionParams = {
        target: IGNITE_ADDRESS,
        data: encodeFunctionData({
            abi: igniteAbi,
            functionName: 'registerWithErc20Fee',
            args: [paymentMethodAddress, register.data.nodeId, register.data.blsProofOfPossession, time],
        }),
    };

    transactions.push(tx);

    await notify('Waiting for transaction confirmation...');

    // Sign and send transaction
    const result = await sendTransactions({ chainId, account, transactions });
    const message = result.data[result.data.length - 1];

    return toResult(result.isMultisig ? message.message : `Successfully registered node ${register.data.nodeId} with ${props.paymentMethod} token. ${message.message}`);
}

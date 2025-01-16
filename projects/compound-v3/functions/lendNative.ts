import { Address, encodeFunctionData, parseUnits } from 'viem';
import { FunctionReturn, FunctionOptions, TransactionParams, toResult, getChainFromName, checkToApprove, getWrappedNative } from '@heyanon/sdk';
import { getMarketConfigByChainAndToken, isNativeToken, MarketBaseAssets, supportedChains } from '../constants';
import { cometAbi, wethAbi } from '../abis';

interface Props {
    chainName: string;
    account: Address;
    token: MarketBaseAssets;
    lendAmount: string;
}

/**
 *
 * @param param0 - chainName, account, token, where token name is ETH
 * @param param1 - tools
 * @description Lend native token (ETH) into compound
 * @docs https://docs.compound.finance/collateral-and-borrowing/#supply
 */
export async function lendNative({ chainName, account, token, lendAmount }: Props, { sendTransactions, notify, getProvider }: FunctionOptions): Promise<FunctionReturn> {
    // Check wallet connection
    if (!account) return toResult('Wallet not connected', true);

    // Validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Protocol is not supported on ${chainName}`, true);

    const isNative = isNativeToken(chainId, token);
    if (!isNative) return toResult('Token is not native', true);

    // Get market config for chain and token
    const marketConfig = getMarketConfigByChainAndToken(chainId, token);
    if (!marketConfig) return toResult(`Market ${token} not found`, true);

    const cometAddress = marketConfig.cometAddress;
    const cometName = marketConfig.name;
    const transactions: TransactionParams[] = [];

    try {
        const provider = getProvider(chainId);
        const wrappedNative = getWrappedNative(chainId);
        const lendNativeAmountInWei = parseUnits(lendAmount, wrappedNative.decimals);

        // check user balance
        const userBalance = await provider.getBalance({
            address: account,
        });

        if (Number(userBalance) < Number(lendNativeAmountInWei)) {
            return toResult('Insufficient balance', true);
        }

        // wrap native token
        const wrapNativeTrx: TransactionParams = {
            target: wrappedNative.address,
            data: encodeFunctionData({
                abi: wethAbi,
                functionName: 'deposit',
            }),
            value: lendNativeAmountInWei,
        };

        transactions.push(wrapNativeTrx);

        // approve wrapped token
        await checkToApprove({
            args: {
                account,
                target: wrappedNative.address,
                spender: cometAddress,
                amount: lendNativeAmountInWei,
            },
            provider,
            transactions,
        });

        // lend wrapped token
        const lendTrx: TransactionParams = {
            target: cometAddress,
            data: encodeFunctionData({
                abi: cometAbi,
                functionName: 'supply',
                args: [wrappedNative.address, lendNativeAmountInWei],
            }),
        };

        transactions.push(lendTrx);

        await notify('Waiting for transaction confirmation...');
        const result = await sendTransactions({ chainId, account, transactions });
        const depositMessage = result.data[result.data.length - 1];

        return toResult(result.isMultisig ? depositMessage.message : `Successfully lent ${lendAmount} ${token} to ${cometName}. ${depositMessage.message}`);
    } catch (error) {
        return toResult(`Failed to lend ${lendAmount} native token into ${cometName}`, true);
    }
}

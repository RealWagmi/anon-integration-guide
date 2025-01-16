import { Address, encodeFunctionData, erc20Abi, parseUnits } from 'viem';
import { FunctionReturn, FunctionOptions, TransactionParams, toResult, getChainFromName, checkToApprove } from '@heyanon/sdk';
import { getMarketConfigByChainAndToken, MarketBaseAssets, supportedChains } from '../constants';
import { cometAbi } from '../abis';

interface Props {
    chainName: string;
    account: Address;
    token: MarketBaseAssets;
    lendAmount: string;
}

/**
 *
 * @param param0 - chainName, account, token, where token name is USDT, USDC, but not ETH or USDT on Ethereum. See enum {MarketBaseAssets}
 * @param param1 - tools
 * @description Lend any supported asset into compound (except ETH and USDT on Ethereum)
 * @docs https://docs.compound.finance/collateral-and-borrowing/#supply
 */
export async function lend({ chainName, account, token, lendAmount }: Props, { sendTransactions, notify, getProvider }: FunctionOptions): Promise<FunctionReturn> {
    // Check wallet connection
    if (!account) return toResult('Wallet not connected', true);

    // Validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Protocol is not supported on ${chainName}`, true);

    // Get market config for chain and token
    const marketConfig = getMarketConfigByChainAndToken(chainId, token);
    if (!marketConfig) return toResult(`Market ${token} not found`, true);

    const cometAddress = marketConfig.cometAddress;
    const tokenAddress = marketConfig.baseAssetAddress;
    const cometName = marketConfig.name;
    const transactions: TransactionParams[] = [];

    try {
        const provider = getProvider(chainId);
        const lendAmountInWei = parseUnits(lendAmount, marketConfig.baseAssetDecimals);

        // Get user balance
        const userBalance = await provider.readContract({
            address: tokenAddress,
            abi: erc20Abi,
            functionName: 'balanceOf',
            args: [account],
        });

        // check is balance is greater than lend amount
        if (Number(userBalance) < Number(lendAmountInWei)) {
            return toResult('Insufficient balance', true);
        }

        await checkToApprove({
            args: {
                account,
                target: tokenAddress,
                spender: cometAddress,
                amount: lendAmountInWei,
            },
            provider,
            transactions,
        });

        // Prepare deposit transaction
        const tx: TransactionParams = {
            target: cometAddress,
            data: encodeFunctionData({
                abi: cometAbi,
                functionName: 'supply',
                args: [tokenAddress, lendAmountInWei],
            }),
        };

        transactions.push(tx);

        await notify('Waiting for transaction confirmation...');
        const result = await sendTransactions({ chainId, account, transactions });
        const depositMessage = result.data[result.data.length - 1];

        return toResult(result.isMultisig ? depositMessage.message : `Successfully lent ${lendAmount} ${token} to ${cometName}. ${depositMessage.message}`);
    } catch (error) {
        return toResult(`Failed to lend ${lendAmount} ${token} into ${cometName}`, true);
    }
}

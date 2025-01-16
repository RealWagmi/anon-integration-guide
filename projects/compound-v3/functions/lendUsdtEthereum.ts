import { Address, encodeFunctionData, parseUnits } from 'viem';
import { FunctionReturn, FunctionOptions, TransactionParams, toResult, getChainFromName, checkToApprove, getWrappedNative } from '@heyanon/sdk';
import { getMarketConfigByChainAndToken, isEthereumUsdt, MarketBaseAssets, supportedChains } from '../constants';
import { cometAbi, usdtEthereumAbi } from '../abis';

interface Props {
    chainName: string;
    account: Address;
    token: MarketBaseAssets;
    lendAmount: string;
}

/**
 *
 * @param param0 - chainName is Ethereum, account, token, where token name is USDT
 * @param param1 - tools
 * @description Lend USDT on Ethereum
 * @docs https://docs.compound.finance/collateral-and-borrowing/#supply
 */
export async function lendUsdtEthereum({ chainName, account, token, lendAmount }: Props, { sendTransactions, notify, getProvider }: FunctionOptions): Promise<FunctionReturn> {
    // Check wallet connection
    if (!account) return toResult('Wallet not connected', true);

    // Validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Protocol is not supported on ${chainName}`, true);

    const isEthUsdt = isEthereumUsdt(chainId, token);
    if (!isEthUsdt) return toResult('Token is not Ethereum USDT', true);

    // Get market config for chain and token
    const marketConfig = getMarketConfigByChainAndToken(chainId, token);
    if (!marketConfig) return toResult(`Market ${token} not found`, true);

    const cometAddress = marketConfig.cometAddress;
    const tokenAddress = marketConfig.baseAssetAddress;
    const cometName = marketConfig.name;
    const transactions: TransactionParams[] = [];

    try {
        const provider = getProvider(chainId);

        // check if user address has allowance for USDT
        // if yes, set it to 0
        const lendUsdtInWei = parseUnits(lendAmount, marketConfig.baseAssetDecimals);

        const allowance = await provider.readContract({
            address: tokenAddress,
            abi: usdtEthereumAbi,
            functionName: 'allowance',
            args: [account, cometAddress],
        });

        // if 0 < allowance < lendAmount, set allowance to 0 and then to lendAmount
        if (Number(allowance) < Number(lendUsdtInWei) && Number(allowance) > 0) {
            await checkToApprove({
                args: {
                    account,
                    target: tokenAddress,
                    spender: cometAddress,
                    amount: 0n,
                },
                provider,
                transactions,
            });

            await checkToApprove({
                args: {
                    account,
                    target: tokenAddress,
                    spender: cometAddress,
                    amount: lendUsdtInWei,
                },
                provider,
                transactions,
            });
        }

        if (Number(allowance) === 0) {
            await checkToApprove({
                args: {
                    account,
                    target: tokenAddress,
                    spender: cometAddress,
                    amount: lendUsdtInWei,
                },
                provider,
                transactions,
            });
        }

        const tx: TransactionParams = {
            target: cometAddress,
            data: encodeFunctionData({
                abi: cometAbi,
                functionName: 'supply',
                args: [tokenAddress, lendUsdtInWei],
            }),
        };

        transactions.push(tx);

        await notify('Waiting for transaction confirmation...');
        const result = await sendTransactions({ chainId, account, transactions });
        const depositMessage = result.data[result.data.length - 1];

        return toResult(result.isMultisig ? depositMessage.message : `Successfully lent ${lendAmount} ${token} to ${cometName}. ${depositMessage.message}`);
    } catch (error) {
        return toResult(`Failed to lend ${lendAmount} USDT on ${cometName}`, true);
    }
}

import { Address, encodeFunctionData, erc20Abi, parseUnits } from 'viem';
import { FunctionReturn, FunctionOptions, TransactionParams, toResult, getChainFromName, checkToApprove } from '@heyanon/sdk';
import { getMarketConfigByChainAndTokenAddress, isNativeToken, isUsdtOnEthereum, nativeTokensAddress, supportedChains, SupprotedChainsType } from '../constants';
import { cometAbi, usdtEthereumAbi, wethAbi } from '../abis';

interface Props {
    chainName: string;
    account: Address;
    tokenAddress: Address;
    lendAmount: string;
}

/**
 *
 * @param param0 - chainName, account, token, where token is {MarketBaseAssets} enum
 * @param param1 - tools
 * @description Lend all supported asset by Compound
 * @docs https://docs.compound.finance/collateral-and-borrowing/#supply
 */
export async function lend({ chainName, account, tokenAddress, lendAmount }: Props, { sendTransactions, notify, getProvider }: FunctionOptions): Promise<FunctionReturn> {
    // Check wallet connection
    if (!account) return toResult('Wallet not connected', true);

    // Validate chain
    const chainId = getChainFromName(chainName) as SupprotedChainsType;
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Protocol is not supported on ${chainName}`, true);

    // Get market config for chain and token
    const marketConfig = getMarketConfigByChainAndTokenAddress(chainId, tokenAddress);
    if (!marketConfig) return toResult(`Market ${tokenAddress} not found`, true);

    const cometAddress = marketConfig.cometAddress;
    const cometName = marketConfig.name;
    const transactions: TransactionParams[] = [];
    const provider = getProvider(chainId);

    // 1. Is native
    // 2. Is USDT on Ethereum
    // 3. Other assets
    try {
        if (isNativeToken(tokenAddress)) {
            const lendNativeAmountInWei = parseUnits(lendAmount, marketConfig.baseAssetDecimals);
            const wrappedAddress = nativeTokensAddress[chainId];

            if (!wrappedAddress) {
                return toResult(`Wrapped native address not found for chain ${chainId}`, true);
            }
            // check user balance
            const userBalance = await provider.getBalance({
                address: account,
            });

            if (Number(userBalance) < Number(lendNativeAmountInWei)) {
                return toResult('Insufficient balance', true);
            }

            // wrap native token
            const wrapNativeTrx: TransactionParams = {
                target: wrappedAddress,
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
                    target: wrappedAddress,
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
                    args: [wrappedAddress, lendNativeAmountInWei],
                }),
            };

            transactions.push(lendTrx);

            await notify('Waiting for transaction confirmation...');
            const result = await sendTransactions({ chainId, account, transactions });
            const depositMessage = result.data[result.data.length - 1];

            return toResult(result.isMultisig ? depositMessage.message : `Successfully lent ${lendAmount} to ${cometName}. ${depositMessage.message}`);
        }

        if (isUsdtOnEthereum(chainId, tokenAddress)) {
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

            return toResult(result.isMultisig ? depositMessage.message : `Successfully lent ${lendAmount} to ${cometName}. ${depositMessage.message}`);
        }

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

        return toResult(result.isMultisig ? depositMessage.message : `Successfully lent ${lendAmount} to ${cometName}. ${depositMessage.message}`);
    } catch (error) {
        return toResult(`Failed to lend ${lendAmount} into ${cometName}`, true);
    }
}

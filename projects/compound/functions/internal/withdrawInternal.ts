import { Address, encodeFunctionData, erc20Abi, parseUnits } from 'viem';
import { FunctionReturn, FunctionOptions, TransactionParams, toResult, getChainFromName, checkToApprove } from '@heyanon/sdk';
import { comets, collateralAssets, supportedChains } from '../../constants';
import { cometAbi } from '../../abis/cometAbi';

export interface Props {
    chainName: string;
    account: Address;
    baseAsset: string;
    supplyAsset: string;
    amount: string;
}

/**
 * @name withdrawInternal
 * @description Internal function for withdrawing any suppliable asset from a market.
 */
export async function withdrawInternal(
    { chainName, account, baseAsset, supplyAsset, amount }: Props,
    { getProvider, sendTransactions, notify }: FunctionOptions,
): Promise<FunctionReturn> {
    // check wallet connection
    if (!account) return toResult('Wallet not connected', true);

    // validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Protocol is not supported on ${chainName}`, true);

    // validate market
    if (!comets[chainId][baseAsset]) return toResult(`Unsupported market: ${baseAsset}. Supported markets include: ${Object.keys(comets[chainId]).join(', ')}`, true);
    const cometAddress = comets[chainId][baseAsset].address;

    // validate amount
    const amountInWei = parseUnits(amount, 18);
    if (amountInWei === 0n) return toResult('Amount must be greater than 0', true);

    const provider = getProvider(chainId);
    const transactions: TransactionParams[] = [];

    // check if supply asset is base asset
    const supplyAssetAddress = collateralAssets[chainId][supplyAsset];
    if (supplyAsset !== baseAsset) {
        // get supply asset balance
        const publicClient = getProvider(chainId);
        const amountSupplied = (
            await publicClient.readContract({
                address: cometAddress,
                abi: cometAbi,
                functionName: 'userCollateral',
                args: [account, supplyAssetAddress],
            })
        )[0];

        // throw error if amount withdrawn is greater than amount supplied
        if (amountInWei > amountSupplied) return toResult(`Insufficient balance. You have supplied ${amountSupplied} ${supplyAsset}, while trying to withdraw ${amount}.`, true);
    } else if (supplyAsset === baseAsset) {
        // else, validate token balance
        const supplyAssetBalance = await provider.readContract({ abi: erc20Abi, address: supplyAssetAddress, functionName: 'balanceOf', args: [account] });
        if (supplyAssetBalance < amountInWei) return toResult(`Insufficient balance. You have ${supplyAssetBalance} ${supplyAsset}, while trying to withdraw ${amount}.`, true);
    }

    // approve
    await notify(`Preparing transaction to withdraw ${amount} ${supplyAsset}...`);
    await checkToApprove({ args: { account, target: supplyAssetAddress, spender: cometAddress, amount: amountInWei }, provider, transactions });

    // withdraw transaction
    const tx: TransactionParams = {
        target: cometAddress,
        data: encodeFunctionData({ abi: cometAbi, functionName: 'withdraw', args: [supplyAssetAddress, amountInWei] }),
    };

    transactions.push(tx);

    // sign and send transaction
    await notify('Waiting for transaction confirmation...');
    const result = await sendTransactions({ chainId, account, transactions });
    const message = result.data[result.data.length - 1];

    return toResult(result.isMultisig ? message.message : `Successfully withdrew ${amount} ${supplyAsset} from the ${baseAsset} market. ${message.message}`);
}

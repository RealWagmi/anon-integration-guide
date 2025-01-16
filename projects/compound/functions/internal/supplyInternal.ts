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
 * @name supplyInternal
 * @description Internal function for supplying any suppliable asset to a market.
 */
export async function supplyInternal(
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

    // validate balances
    const supplyAssetAddress = collateralAssets[chainId][supplyAsset];
    const supplyAssetBalance = await provider.readContract({ abi: erc20Abi, address: supplyAssetAddress, functionName: 'balanceOf', args: [account] });
    if (supplyAssetBalance < amountInWei) return toResult(`Insufficient balance. You have ${supplyAssetBalance} ${supplyAsset}, while trying to supply ${amount}.`, true);

    // approve
    await notify(`Preparing transaction to supply ${amount} ${supplyAsset}...`);
    await checkToApprove({ args: { account, target: supplyAssetAddress, spender: cometAddress, amount: amountInWei }, provider, transactions });

    // supply transaction
    const tx: TransactionParams = {
        target: cometAddress,
        data: encodeFunctionData({ abi: cometAbi, functionName: 'supply', args: [supplyAssetAddress, amountInWei] }),
    };

    transactions.push(tx);

    // sign and send transaction
    await notify('Waiting for transaction confirmation...');
    const result = await sendTransactions({ chainId, account, transactions });
    const message = result.data[result.data.length - 1];

    return toResult(result.isMultisig ? message.message : `Successfully supplied ${amount} ${supplyAsset} to the ${baseAsset} market. ${message.message}`);
}

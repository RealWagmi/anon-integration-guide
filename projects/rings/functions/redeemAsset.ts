import { Address, encodeFunctionData, erc20Abi, parseUnits } from 'viem';
import {
	FunctionReturn,
	FunctionOptions,
	TransactionParams,
	toResult,
	getChainFromName,
    checkToApprove
} from '@heyanon/sdk';
import { supportedChains, TOKEN } from '../constants';
import { scWithdrawQueueAbi } from '../abis';

interface Props {
	chainName: string;
	account: Address;
	amount: string;
	asset: string;
}

/**
 * Redeems asset from the Rings protocol.
 * @param props - The redeem parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Request ID.
 */
export async function redeemAsset(
	{ chainName, account, amount, asset }: Props,
	{ sendTransactions, notify, getProvider }: FunctionOptions
): Promise<FunctionReturn> {
	// Check wallet connection
	if (!account) return toResult('Wallet not connected', true);

    await notify('Checking everything...');

	// Validate chain
	const chainId = getChainFromName(chainName);
	if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
	if (!supportedChains.includes(chainId)) return toResult(`Rings is not supported on ${chainName}`, true);

	// Normalize asset name to uppercase to match TOKEN keys
    const assetUpper = asset.toUpperCase();

	// Validate asset
	let baseAsset;
	if (['ETH', 'USD'].includes(assetUpper)) {
		baseAsset = assetUpper;
	} else if (['WETH', 'USDC'].includes(assetUpper)) {
		baseAsset = assetUpper === 'WETH' ? 'ETH' : 'USD';
	} else {
		return toResult(`Unsupported asset: ${asset}`, true);
	}

	const lpAsset = (baseAsset === 'ETH' ? TOKEN.ETH.SCETH.address : TOKEN.USD.SCUSD.address) as Address;

    // Validate amount
    const provider = getProvider(chainId);
    const amountWithDecimals = parseUnits(amount, 18);
    if (amountWithDecimals === 0n) return toResult('Amount must be greater than 0', true);
    const balance = await provider.readContract({
        address: lpAsset,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [account],
    })
    if (balance < amountWithDecimals) return toResult('Amount exceeds your balance', true);

    await notify('Sending request to redeem WETH...');

    const transactions: TransactionParams[] = [];

	const withdrawAddress = (baseAsset === 'ETH' ? TOKEN.ETH.SCETH.withdraw : TOKEN.USD.SCUSD.withdraw) as Address;
	const redeemAsset = (baseAsset === 'ETH' ? TOKEN.ETH.WETH.address : TOKEN.USD.USDC.address) as Address;

    // Approve the asset beforehand
    await checkToApprove({
        args: {
            account,
            target: lpAsset,
            spender: withdrawAddress,
            amount: amountWithDecimals
        },
        transactions,
        provider,
    });
    
	// Prepare redeem transaction
	const discount = 1;
	const secondsToDeadline = 432000;
	const tx: TransactionParams = {
			target: withdrawAddress,
			data: encodeFunctionData({
					abi: scWithdrawQueueAbi,
					functionName: 'requestOnChainWithdraw',
					args: [redeemAsset, amountWithDecimals, discount, secondsToDeadline],
			}),
	};
	transactions.push(tx);

	// Sign and send transaction
	const result = await sendTransactions({ chainId, account, transactions });
	const redeemMessage = result.data[result.data.length - 1];

	return toResult(result.isMultisig ? redeemMessage.message : `Successfully requested redeem for ${asset}. ${asset} will be deposited in 5 days.`);
}
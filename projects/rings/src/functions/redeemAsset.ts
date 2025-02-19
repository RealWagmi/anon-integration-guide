import { Address, encodeFunctionData, erc20Abi, parseUnits } from 'viem';
import { FunctionReturn, FunctionOptions, toResult, EVM, EvmChain } from '@heyanon/sdk';
import { supportedChains, TOKEN } from '../constants';
import { scWithdrawQueueAbi } from '../abis';
const { getChainFromName, checkToApprove } = EVM.utils;

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
export async function redeemAsset({ chainName, account, amount, asset }: Props, options: FunctionOptions): Promise<FunctionReturn> {
	const {
		evm: { getProvider, sendTransactions },
		notify,
	} = options;

	// Check wallet connection
	if (!account) return toResult('Wallet not connected', true);

    await notify('Checking everything...');

	// Validate chain
	const chainId = getChainFromName(chainName as EvmChain);
	if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
	if (!supportedChains.includes(chainId)) return toResult(`Rings is not supported on ${chainName}`, true);

	// Normalize asset name to uppercase to match TOKEN keys
    const assetUpper = asset.toUpperCase();

	// Validate asset
	let baseAsset;
	if (['ETH', 'USD', 'BTC'].includes(assetUpper)) {
		baseAsset = assetUpper;
	} else if (['WETH', 'USDC', 'WBTC'].includes(assetUpper)) {
		baseAsset = assetUpper === 'WETH' ? 'ETH' : (assetUpper === 'WBTC' ? 'BTC' : 'USD');
	} else {
		return toResult(`Unsupported asset: ${asset}`, true);
	}

	const lpAsset = TOKEN[baseAsset][`SC${baseAsset}`];

    // Validate amount
    const provider = getProvider(chainId);
	const decimals = lpAsset.decimals;
    const amountWithDecimals = parseUnits(amount, decimals);
    if (amountWithDecimals === 0n) return toResult('Amount must be greater than 0', true);
    const balance = await provider.readContract({
        address: lpAsset.address,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [account],
    })
    if (balance < amountWithDecimals) return toResult('Amount exceeds your balance', true);

    await notify(`Sending request to redeem ${baseAsset}...`);

    const transactions: EVM.types.TransactionParams[] = [];

	const withdrawAddress = lpAsset.withdraw as Address;
	const redeemAsset = baseAsset === 'ETH' ? 'WETH' : (baseAsset === 'BTC' ? 'WBTC' : 'USDC');

    // Approve the asset beforehand
    await checkToApprove({
        args: {
            account,
            target: lpAsset.address,
            spender: withdrawAddress,
            amount: amountWithDecimals
        },
        transactions,
        provider,
    });
    
	// Prepare redeem transaction
	const discount = 1;
	const secondsToDeadline = 432000;
	const tx: EVM.types.TransactionParams = {
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

	return toResult(
		result.isMultisig ? 
		redeemMessage.message : 
		`Successfully requested redeem for ${asset}. ${asset} will be deposited in 5 days. You can cancel the redeem during that period.`
	);
}
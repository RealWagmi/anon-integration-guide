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
import { stkscWithdrawQueueAbi } from '../abis';

interface Props {
	chainName: string;
	account: Address;
	amount: string;
	asset: string;
}

/**
 * Unstakes LP asset from the Rings protocol.
 * @param props - The unstake parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Request ID.
 */
export async function unstakeAsset(
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
	let tokenConfig;
	let baseAsset;
	if (['STKSCETH', 'STKSCUSD'].includes(assetUpper)) {
		baseAsset = assetUpper.slice(5);
		tokenConfig = TOKEN[baseAsset][assetUpper];
	} else if (['SCETH', 'SCUSD'].includes(assetUpper)) {
		baseAsset = assetUpper.slice(2);
		tokenConfig = TOKEN[baseAsset][`STK${assetUpper}`];
	} else {
		return toResult(`Unsupported asset: ${asset}`, true);
	}

	const stakedAsset = tokenConfig.address;

    // Validate amount
    const provider = getProvider(chainId);
    const amountWithDecimals = parseUnits(amount, 18);
    if (amountWithDecimals === 0n) return toResult('Amount must be greater than 0', true);
    const balance = await provider.readContract({
        address: stakedAsset,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [account],
    })
    if (balance < amountWithDecimals) return toResult('Amount exceeds your balance', true);

    await notify('Sending unstake request...');

    const transactions: TransactionParams[] = [];

	const withdrawAddress = tokenConfig.withdraw;
	const lpAsset = (baseAsset === 'ETH' ? TOKEN.ETH.SCETH.address : TOKEN.USD.SCUSD.address) as Address;

    // Approve the asset beforehand
    await checkToApprove({
        args: {
            account,
            target: stakedAsset,
            spender: withdrawAddress,
            amount: amountWithDecimals
        },
        transactions,
        provider,
    });
    
	// Prepare unstake transaction
	const discount = 1;
	const secondsToDeadline = 432000;
	const tx: TransactionParams = {
			target: withdrawAddress,
			data: encodeFunctionData({
					abi: stkscWithdrawQueueAbi,
					functionName: 'requestOnChainWithdraw',
					args: [lpAsset, amountWithDecimals, discount, secondsToDeadline],
			}),
	};
	transactions.push(tx);

	// Sign and send transaction
	const result = await sendTransactions({ chainId, account, transactions });
	const unstakeMessage = result.data[result.data.length - 1];

	return toResult(result.isMultisig ? unstakeMessage.message : `Successfully requested unstake for scETH. scETH will be deposited in 5 days.`);
}
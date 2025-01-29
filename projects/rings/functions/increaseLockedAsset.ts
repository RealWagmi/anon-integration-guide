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
import { veAbi } from '../abis';

interface Props {
	chainName: string;
	account: Address;
	amount: string;
	asset: string;
}

/**
 * Increases locked staked asset in the Rings protocol.
 * @param props - The lock parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Success message.
 */
export async function increaseLockedAsset(
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
	if (['STKSCETH', 'STKSCUSD'].includes(assetUpper)) {
		baseAsset = assetUpper.slice(5);
	} else if (['VEETH', 'VEUSD'].includes(assetUpper)) {
		baseAsset = assetUpper.slice(2);
	} else {
		return toResult(`Unsupported asset: ${asset}`, true);
	}
	
	const stakedAsset = (baseAsset === 'ETH' ? TOKEN.ETH.STKSCETH.address : TOKEN.USD.STKSCUSD.address) as Address;

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

    await notify(`Locking ${amount} stksc${baseAsset}...`);

	const transactions: TransactionParams[] = [];

	const voteAsset = (baseAsset === 'ETH' ? TOKEN.ETH.VEETH.address : TOKEN.USD.VEUSD.address) as Address;

    // Approve the asset beforehand
    await checkToApprove({
        args: {
            account,
            target: stakedAsset,
            spender: voteAsset,
            amount: amountWithDecimals
        },
        transactions,
        provider,
    });
    
	// Prepare lock transaction
    const tokenId = await provider.readContract({
        address: voteAsset,
        abi: veAbi,
        functionName: 'tokenOfOwnerByIndex',
        args: [account, 0],
    })
    if (tokenId === 0) return toResult(`No locked stksc${baseAsset}`, true);

	const tx: TransactionParams = {
			target: voteAsset,
			data: encodeFunctionData({
					abi: veAbi,
					functionName: 'increase_amount',
					args: [tokenId, amountWithDecimals],
			}),
	};
	transactions.push(tx);

	// Sign and send transaction
	const result = await sendTransactions({ chainId, account, transactions });
	const lockMessage = result.data[result.data.length - 1];

	return toResult(result.isMultisig ? lockMessage.message : `Successfully locked ${amount} stksc${baseAsset}.`);
}
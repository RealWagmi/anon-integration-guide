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
	weeks: number;
}

/**
 * Locks staked asset in the Rings protocol for the opportunity to vote.
 * @param props - The lock parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns ERC-721 token ID.
 */
export async function lockAsset(
	{ chainName, account, amount, asset, weeks }: Props,
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

	const stakedAsset = baseAsset === 'ETH' ? TOKEN.ETH.STKSCETH : TOKEN.USD.STKSCUSD;

    // Validate amount
    const provider = getProvider(chainId);
	const decimals = TOKEN[baseAsset][stakedAsset].decimals;
    const amountWithDecimals = parseUnits(amount, decimals);
    if (amountWithDecimals === 0n) return toResult('Amount must be greater than 0', true);
    const balance = await provider.readContract({
        address: stakedAsset.address as Address,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [account],
    })
    if (balance < amountWithDecimals) return toResult('Amount exceeds your balance', true);

	// Validate lock duration
	if (weeks < 1 || weeks > 104) return toResult('Lock duration must be between 1 and 104 weeks', true);

    await notify(`Locking stksc${baseAsset}...`);

    const transactions: TransactionParams[] = [];

	const voteAsset = baseAsset === 'ETH' ? TOKEN.ETH.VEETH : TOKEN.USD.VEUSD;

    // Approve the asset beforehand
    await checkToApprove({
        args: {
            account,
            target: stakedAsset.address as Address,
            spender: voteAsset.address as Address,
            amount: amountWithDecimals
        },
        transactions,
        provider,
    });
    
	// Prepare lock transaction
	const lockDuration = weeks * 7 * 24 * 60 * 60;
	const tx: TransactionParams = {
			target: voteAsset.address as Address,
			data: encodeFunctionData({
					abi: veAbi,
					functionName: 'create_lock',
					args: [amountWithDecimals, lockDuration],
			}),
	};
	transactions.push(tx);

	// Sign and send transaction
	const result = await sendTransactions({ chainId, account, transactions });
	const lockMessage = result.data[result.data.length - 1];

	return toResult(result.isMultisig ? lockMessage.message : `Successfully locked stksc${baseAsset} for ${weeks} weeks. Your NFT ID is ${lockMessage.message}`);
}
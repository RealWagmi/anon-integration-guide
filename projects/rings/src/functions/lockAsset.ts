import { Address, encodeFunctionData, erc20Abi, parseUnits } from 'viem';
import { FunctionReturn, FunctionOptions, toResult, EVM, EvmChain } from '@heyanon/sdk';
import { supportedChains, TOKEN } from '../constants';
import { veAbi } from '../abis';
const { getChainFromName, checkToApprove } = EVM.utils;

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
export async function lockAsset({ chainName, account, amount, asset, weeks }: Props, options: FunctionOptions): Promise<FunctionReturn> {
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
	if (['STKSCETH', 'STKSCUSD', 'STKSCBTC'].includes(assetUpper)) {
		baseAsset = assetUpper.slice(5);
	} else if (['VEETH', 'VEUSD', 'VEBTC'].includes(assetUpper)) {
		baseAsset = assetUpper.slice(2);
	} else {
		return toResult(`Unsupported asset: ${asset}`, true);
	}

	const stakedAssetAddress = TOKEN[baseAsset][`STKSC${baseAsset}`].address;

    // Validate amount
    const provider = getProvider(chainId);
	const decimals = TOKEN[baseAsset][`STKSC${baseAsset}`].decimals;
    const amountWithDecimals = parseUnits(amount, decimals);
    if (amountWithDecimals === 0n) return toResult('Amount must be greater than 0', true);
    const balance = await provider.readContract({
        address: stakedAssetAddress,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [account],
    })
    if (balance < amountWithDecimals) return toResult('Amount exceeds your balance', true);

	// Validate lock duration
	if (weeks < 1 || weeks > 52 || !Number.isInteger(weeks)) return toResult('Lock duration must be integer and between 1 and 52 weeks', true);

    await notify(`Locking stksc${baseAsset}...`);

    const transactions: EVM.types.TransactionParams[] = [];

	const voteAssetAddress = TOKEN[baseAsset][`VE${baseAsset}`].address;

    // Approve the asset beforehand
    await checkToApprove({
        args: {
            account,
            target: stakedAssetAddress,
            spender: voteAssetAddress,
            amount: amountWithDecimals
        },
        transactions,
        provider,
    });
    
	// Prepare lock transaction
	const lockDuration = weeks * 7 * 24 * 60 * 60;
	const tx: EVM.types.TransactionParams = {
			target: voteAssetAddress,
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
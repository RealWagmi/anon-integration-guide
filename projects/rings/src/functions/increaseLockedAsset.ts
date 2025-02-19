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
}

/**
 * Increases locked staked asset in the Rings protocol.
 * @param props - The lock parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Success message.
 */
export async function increaseLockedAsset({ chainName, account, amount, asset }: Props, options: FunctionOptions): Promise<FunctionReturn> {
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
	
	const stakedAsset = TOKEN[baseAsset][`STKSC${baseAsset}`];

	// Validate amount
    const provider = getProvider(chainId);
	const decimals = stakedAsset.decimals;
    const amountWithDecimals = parseUnits(amount, decimals);
    if (amountWithDecimals === 0n) return toResult('Amount must be greater than 0', true);
    const balance = await provider.readContract({
        address: stakedAsset.address,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [account],
    })
    if (balance < amountWithDecimals) return toResult('Amount exceeds your balance', true);

    await notify(`Locking ${amount} stksc${baseAsset}...`);

	const transactions: EVM.types.TransactionParams[] = [];

	const voteAssetAddress = TOKEN[baseAsset][`VE${baseAsset}`].address;

    // Approve the asset beforehand
    await checkToApprove({
        args: {
            account,
            target: stakedAsset.address,
            spender: voteAssetAddress,
            amount: amountWithDecimals
        },
        transactions,
        provider,
    });
    
	// Prepare lock transaction
    const tokenId = await provider.readContract({
        address: voteAssetAddress,
        abi: veAbi,
        functionName: 'tokenOfOwnerByIndex',
        args: [account, 0],
    })
    if (tokenId === 0) return toResult(`No locked stksc${baseAsset}`, true);

	const tx: EVM.types.TransactionParams = {
			target: voteAssetAddress,
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
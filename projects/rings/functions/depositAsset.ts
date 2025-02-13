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
import { scTellerAbi, wrappedNativeAbi } from '../abis';

interface Props {
	chainName: string;
	account: Address;
	amount: string;
	asset: string;
}

/**
 * Deposits asset into the Rings protocol.
 * @param props - The deposit parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Amount of LP tokens.
 */
export async function depositAsset(
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
	if (['ETH', 'USD'].includes(assetUpper)) {
		baseAsset = assetUpper;
		const depositAsset = baseAsset === 'ETH' ? 'WETH' : 'USDC';
		tokenConfig = TOKEN[baseAsset][depositAsset];
	} else if (['WETH', 'USDC'].includes(assetUpper)) {
		baseAsset = assetUpper === 'WETH' ? 'ETH' : 'USD';
		tokenConfig = TOKEN[baseAsset][assetUpper];
	} else {
		return toResult(`Unsupported asset: ${asset}`, true);
	}

	const assetAddress = tokenConfig.address;

	const transactions: TransactionParams[] = [];

    // Validate amount and wrap ETH
    const provider = getProvider(chainId);
	let amountWithDecimals;
	const decimals = tokenConfig.decimals;
	if (assetUpper === 'ETH') {
		const ethBalance = await provider.getBalance({
			address: account
		});
        amountWithDecimals = parseUnits(amount, decimals);
        
        if (ethBalance < amountWithDecimals) {
            return toResult('Amount exceeds your ETH balance', true);
        }

		const wrapTx: TransactionParams = {
			target: assetAddress,
			data: encodeFunctionData({
					abi: wrappedNativeAbi,
					functionName: 'deposit',
			}),
            value: amountWithDecimals,
	    };
		transactions.push(wrapTx);
	} else {
		amountWithDecimals = parseUnits(amount, decimals);
		if (amountWithDecimals === 0n) return toResult('Amount must be greater than 0', true);

		const balance = await provider.readContract({
			address: assetAddress,
			abi: erc20Abi,
			functionName: 'balanceOf',
			args: [account],
		});
		if (balance < amountWithDecimals) return toResult('Amount exceeds your balance', true);
	}

    await notify(`Depositing ${asset}...`);

	const depositAddress = (baseAsset === 'ETH' ? TOKEN.ETH.SCETH.teller : TOKEN.USD.SCUSD.teller) as Address;

    // Approve the asset beforehand
    await checkToApprove({
        args: {
            account,
            target: assetAddress,
            spender: depositAddress,
            amount: amountWithDecimals
        },
        transactions,
        provider,
    });
    
	// Prepare deposit transaction
	const tx: TransactionParams = {
			target: depositAddress,
			data: encodeFunctionData({
					abi: scTellerAbi,
					functionName: 'deposit',
					args: [assetAddress, amountWithDecimals, 0],
			}),
	};
	transactions.push(tx);

	// Sign and send transaction
	const result = await sendTransactions({ chainId, account, transactions });
	const depositMessage = result.data[result.data.length - 1];

	return toResult(result.isMultisig ? depositMessage.message : `Successfully deposited ${asset} for ${depositMessage.message} sc${baseAsset}`);
}
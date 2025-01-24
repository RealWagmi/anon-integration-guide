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
import { stkscTellerAbi } from '../abis';

interface Props {
	chainName: string;
	account: Address;
	amount: string;
	asset: string;
}

/**
 * Stakes LP asset in the Rings protocol.
 * @param props - The stake parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Amount of staked tokens.
 */
export async function stakeAsset(
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
		tokenConfig = TOKEN[baseAsset][`SC${assetUpper}`];
	} else if (['SCETH', 'SCUSD'].includes(assetUpper)) {
		baseAsset = assetUpper.slice(2);
		tokenConfig = TOKEN[baseAsset][assetUpper];
	} else {
		return toResult(`Unsupported asset: ${asset}`, true);
	}

	const lpAsset = tokenConfig.address;

    // Validate amount
    const provider = getProvider(chainId);
	const decimals = await provider.readContract({
        address: lpAsset,
        abi: erc20Abi,
        functionName: 'decimals',
        args: [],
    });
    const amountWithDecimals = parseUnits(amount, decimals);
    if (amountWithDecimals === 0n) return toResult('Amount must be greater than 0', true);
    const balance = await provider.readContract({
        address: lpAsset,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [account],
    })
    if (balance < amountWithDecimals) return toResult('Amount exceeds your balance', true);

    await notify(`Staking sc${baseAsset}...`);

    const transactions: TransactionParams[] = [];

	const withdrawAddress = tokenConfig.withdraw;
	const stakedTeller = (baseAsset === 'ETH' ? TOKEN.ETH.STKSCETH.teller : TOKEN.USD.STKSCUSD.teller) as Address;

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
    
	// Prepare stake transaction
	const tx: TransactionParams = {
			target: stakedTeller,
			data: encodeFunctionData({
					abi: stkscTellerAbi,
					functionName: 'deposit',
					args: [lpAsset, amountWithDecimals, 0],
			}),
	};
	transactions.push(tx);

	// Sign and send transaction
	const result = await sendTransactions({ chainId, account, transactions });
	const stakeMessage = result.data[result.data.length - 1];

	return toResult(result.isMultisig ? stakeMessage.message : `Successfully staked sc${baseAsset} for ${stakeMessage.message} stksc${baseAsset}.`);
}
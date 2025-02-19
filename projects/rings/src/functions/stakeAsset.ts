import { Address, encodeFunctionData, erc20Abi, parseUnits } from 'viem';
import { FunctionReturn, FunctionOptions, toResult, EVM, EvmChain } from '@heyanon/sdk';
import { supportedChains, TOKEN } from '../constants';
import { stkscTellerAbi } from '../abis';
const { getChainFromName, checkToApprove } = EVM.utils;

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
export async function stakeAsset({ chainName, account, amount, asset }: Props, options: FunctionOptions): Promise<FunctionReturn> {
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
	let tokenConfig;
	let baseAsset;
	if (['ETH', 'USD', 'BTC'].includes(assetUpper)) {
		baseAsset = assetUpper;
		tokenConfig = TOKEN[baseAsset][`SC${assetUpper}`];
	} else if (['SCETH', 'SCUSD', 'SCBTC'].includes(assetUpper)) {
		baseAsset = assetUpper.slice(2);
		tokenConfig = TOKEN[baseAsset][assetUpper];
	} else {
		return toResult(`Unsupported asset: ${asset}`, true);
	}

	const lpAssetAddress = tokenConfig.address;

    // Validate amount
    const provider = getProvider(chainId);
	const decimals = tokenConfig.decimals;
    const amountWithDecimals = parseUnits(amount, decimals);
    if (amountWithDecimals === 0n) return toResult('Amount must be greater than 0', true);
    const balance = await provider.readContract({
        address: lpAssetAddress,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [account],
    })
    if (balance < amountWithDecimals) return toResult('Amount exceeds your balance', true);

    await notify(`Staking sc${baseAsset}...`);

    const transactions: EVM.types.TransactionParams[] = [];

	const withdrawAddress = tokenConfig.withdraw as Address;
	const stakedTeller = TOKEN[baseAsset][`STKSC${baseAsset}`].teller as Address;

    // Approve the asset beforehand
    await checkToApprove({
        args: {
            account,
            target: lpAssetAddress,
            spender: withdrawAddress,
            amount: amountWithDecimals
        },
        transactions,
        provider,
    });
    
	// Prepare stake transaction
	const tx: EVM.types.TransactionParams = {
			target: stakedTeller,
			data: encodeFunctionData({
					abi: stkscTellerAbi,
					functionName: 'deposit',
					args: [lpAssetAddress, amountWithDecimals, 0],
			}),
	};
	transactions.push(tx);

	// Sign and send transaction
	const result = await sendTransactions({ chainId, account, transactions });
	const stakeMessage = result.data[result.data.length - 1];

	return toResult(result.isMultisig ? stakeMessage.message : `Successfully staked sc${baseAsset} for ${stakeMessage.message} stksc${baseAsset}.`);
}
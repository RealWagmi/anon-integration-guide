import { Address, encodeFunctionData, parseUnits } from 'viem';
import { FunctionReturn, FunctionOptions, toResult, EVM, EvmChain } from '@heyanon/sdk';
import { CONTRACT, supportedChains, TOKEN } from '../constants';
import { dtokenAbi, oracleAbi, unitrollerAbi } from '../abis';
const { getChainFromName } = EVM.utils;

interface Props {
	chainName: string;
	account: Address;
    amount: string;
	asset: string;
}

/**
 * Borrow asset from the protocol.
 * @param props - The borrow parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Success message.
 */
export async function borrowAsset({ chainName, account, amount, asset }: Props, options: FunctionOptions): Promise<FunctionReturn> {
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
	if (!supportedChains.includes(chainId)) return toResult(`Deepr Finance is not supported on ${chainName}`, true);

    // Validate asset
    const assetConfig = TOKEN[asset.toUpperCase()];
    if (!assetConfig) return toResult(`Asset is not supported`, true);
    const assetAddress = assetConfig.ADDRESS;
    const marketAddress = assetConfig.MARKET.ADDRESS;

    const provider = getProvider(chainId);

    // Validate amount
    const [, liquidity, ] = await provider.readContract({
        address: CONTRACT.UNITROLLER,
        abi: unitrollerAbi,
        functionName: 'getAccountLiquidity',
        args: [account],
    }) as [bigint, bigint, bigint];

    await notify(`You can borrow up to ${liquidity / BigInt(1e18)} USD.`);
    await notify('NEVER borrow the maximum amount or your account will be instantly liquidated.');

    const assetPrice = await provider.readContract({
        address: CONTRACT.ORACLE,
        abi: oracleAbi,
        functionName: 'getPrice',
        args: [assetAddress],
    }) as bigint;
    const decimals = assetConfig.DECIMALS;
    const amountWithDecimals = parseUnits(amount, decimals);
    if (amountWithDecimals === 0n) return toResult('Amount must be greater than 0', true);
    const scaledDecimals = 10**18 * 10**(18 - decimals);

    if (liquidity < BigInt(amount) * assetPrice / BigInt(scaledDecimals)) return toResult('Amount exceeds your liquidity balance', true);

    await notify(`Borrowing ${amount} ${asset}...`);

	// Prepare borrow transaction
	const tx: EVM.types.TransactionParams = {
			target: marketAddress,
			data: encodeFunctionData({
					abi: dtokenAbi,
					functionName: 'borrow',
					args: [amountWithDecimals],
			}),
	};

	// Sign and send transaction
	const result = await sendTransactions({ chainId, account, transactions: [tx] });
	const borrowMessage = result.data[result.data.length - 1];

	return toResult(
        result.isMultisig ? 
        borrowMessage.message : 
        `Successfuly borrowed ${amount} ${asset}.`
    );
}
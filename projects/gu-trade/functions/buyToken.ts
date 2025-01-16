import { Address, encodeFunctionData, parseUnits } from 'viem';
import {
  	FunctionReturn,
  	FunctionOptions,
  	TransactionParams,
  	toResult,
  	getChainFromName
} from '@heyanon/sdk';
import { supportedChains, FACTORY_ADDRESS } from '../constants';
import { factoryAbi, bondingCurveAbi } from '../abis';
import { getTokenAddress } from './getTokenAddress';

interface Props {
  	chainName: string;
  	account: Address;
  	token: Address | string;
	amount: string;
  	slippage?: bigint;
}

/**
 * Buys a specific gu token.
 * @param props - The buy parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Tokens acquired.
 */
export async function buyToken(
    { chainName, account, token, amount, slippage = 5n} : Props,
    { sendTransactions, notify, getProvider }: FunctionOptions
): Promise<FunctionReturn> {
    // Check wallet connection
	if (!account) return toResult('Wallet not connected', true);

	// Validate chain
	const chainId = getChainFromName(chainName);
	if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
	if (!supportedChains.includes(chainId)) return toResult(`Gu is not supported on ${chainName}`, true);

	// If token is a string, resolve it to an address
    if (typeof token === 'string') {
        const resolvedToken = await getTokenAddress({ input: token });
        if (!resolvedToken.success) return toResult(`Couldn't find token address for "${token}". Try again.`, true);
        token = resolvedToken.data as Address;
    }

	// Validate token
	const publicClient = getProvider(chainId);
	const isGuCoin = await publicClient.readContract({
        address: FACTORY_ADDRESS,
        abi: factoryAbi,
        functionName: 'gucoins',
        args: [token],
    });
	if (!isGuCoin) return toResult('Not a Gu coin', true);
	
	// Validate amount
	const amountInWei = parseUnits(amount, 18);
	if (amountInWei === 0n) return toResult('Amount must be greater than 0', true);

	// Validate slippage
	if (slippage > 30) return toResult('Slippage too high', true);

	await notify('Fetching the price...');

	// Fetch bonding curve address
	const bondingCurveAddress = await publicClient.readContract({
        address: FACTORY_ADDRESS,
        abi: factoryAbi,
        functionName: 'bondingCurve',
        args: [],
    }) as Address;

	const getAmountToReceive = await publicClient.readContract({
        address: bondingCurveAddress,
        abi: bondingCurveAbi,
        functionName: 'getAmountOutBuySupplyCapped',
        args: [token, amountInWei],
    }) as bigint;

	const getMinAmountToReceive = getAmountToReceive * (100n - slippage) / 100n;

	await notify('Initializing buy...');

	const tx: TransactionParams = {
        target: bondingCurveAddress,
        data: encodeFunctionData({
            abi: bondingCurveAbi,
            functionName: 'buy',
            args: [token, getMinAmountToReceive],
        }),
		value: amountInWei,
    };

	const result = await sendTransactions({ chainId, account, transactions: [tx] });
    const buyMessage = result.data[result.data.length - 1];

	return toResult(result.isMultisig ? buyMessage.message : `Successfully bought ${buyMessage.message} tokens.`);
}


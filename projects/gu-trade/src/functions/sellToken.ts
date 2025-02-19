import { Address, encodeFunctionData, isAddress, parseUnits } from 'viem';
import { FunctionReturn, FunctionOptions, toResult, EVM, EvmChain } from '@heyanon/sdk';
import { supportedChains, FACTORY_ADDRESS, GU_COIN_DECIMALS } from '../constants';
import { factoryAbi, bondingCurveAbi, guCoinAbi } from '../abis';
import { getTokenAddress } from './getTokenAddress';
const { getChainFromName } = EVM.utils;

interface Props {
  	chainName: string;
  	account: Address;
  	token: Address | string;
	amount: string;
  	slippage: number | null;
}

/**
 * Sells a specific gu token.
 * @param props - The sell parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Amount of ETH received.
 */
export async function sellToken({ chainName, account, token, amount, slippage } : Props, options: FunctionOptions): Promise<FunctionReturn> {
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
	if (!supportedChains.includes(chainId)) return toResult(`Gu is not supported on ${chainName}`, true);

	// If token is a string, resolve it to an address
    if (!isAddress(token)) {
        const resolvedToken = await getTokenAddress({ symbol: token });
        if (!resolvedToken.success) return toResult(`Couldn't find token address for "${token}". Try again.`, true);
        token = resolvedToken.data;
    }

	// Validate token
	const publicClient = getProvider(chainId);
	const isGuCoin = await publicClient.readContract({
        address: FACTORY_ADDRESS,
        abi: factoryAbi,
        functionName: 'gucoins',
        args: [token],
    }) as boolean;
	const isLPd = await publicClient.readContract({
        address: token as Address,
        abi: guCoinAbi,
        functionName: 'isLPd',
    }) as boolean;
	if (!isGuCoin || isLPd) return toResult('Cannot buy a token: LPd or not a Gu coin', true);
	
	// Validate amount
	const amountWithDecimals = parseUnits(amount, GU_COIN_DECIMALS);
	if (amountWithDecimals === 0n) return toResult('Amount must be greater than 0', true);
	const balance = await publicClient.readContract({
        address: token as Address,
        abi: guCoinAbi,
        functionName: 'balanceOf',
        args: [account],
    }) as bigint;
	if (balance < amountWithDecimals) return toResult('Amount exeeds your balance', true);

	// Validate slippage
	if (!slippage) {
		slippage = 5; //default value
	} else if (!Number.isInteger(slippage) || slippage < 0 || slippage > 50) {
		return toResult('Slippage must be an integer in the range of 0% to 50%', true);
	}

	await notify('Fetching the price...');

	// Fetch bonding curve address
	const bondingCurveAddress = await publicClient.readContract({
        address: FACTORY_ADDRESS,
        abi: factoryAbi,
        functionName: 'bondingCurve',
    }) as Address;

	const getAmountToReceive = await publicClient.readContract({
        address: bondingCurveAddress,
        abi: bondingCurveAbi,
        functionName: 'getAmountOutSell',
        args: [token, amountWithDecimals],
    }) as bigint;

	const getMinAmountToReceive = getAmountToReceive * (100n - BigInt(slippage)) / 100n;

	await notify('Initializing sell...'); // checkToApprove is not needed since tokens are burnt

	const tx: EVM.types.TransactionParams = {
        target: bondingCurveAddress,
        data: encodeFunctionData({
            abi: bondingCurveAbi,
            functionName: 'sell',
            args: [token, amountWithDecimals, getMinAmountToReceive],
        }),
    };

	const result = await sendTransactions({ chainId, account, transactions: [tx] });
    const sellMessage = result.data[result.data.length - 1];

	return toResult(result.isMultisig ? sellMessage.message : `Successfully sold ${sellMessage.message} tokens.`);
}
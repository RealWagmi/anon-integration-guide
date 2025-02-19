import { Address, encodeFunctionData, parseUnits } from 'viem';
import { FunctionReturn, FunctionOptions, toResult, EVM, EvmChain } from '@heyanon/sdk';
import { supportedChains, STAKER_GATEWAY_ADDRESS, REFERRAL_ID, WBNB_ADDRESS } from '../constants';
import { stakerGatewayAbi } from '../abis';
const { getChainFromName } = EVM.utils;

interface Props {
  	chainName: string;
  	account: Address;
	amount: string;
}

/**
 * Unstakes BNB in the protocol
 * @param props - The unstake parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Success message.
 */
export async function unstakeBNB({ chainName, account, amount } : Props, options: FunctionOptions): Promise<FunctionReturn> {
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
	if (!supportedChains.includes(chainId)) return toResult(`Kernel is not supported on ${chainName}`, true);

    const provider = getProvider(chainId);

	// Validate amount
	const amountWithDecimals = parseUnits(amount, 18);
	if (amountWithDecimals === 0n) return toResult('Amount must be greater than 0', true);
	const balance = await provider.readContract({
        address: STAKER_GATEWAY_ADDRESS,
        abi: stakerGatewayAbi,
        functionName: 'balanceOf',
        args: [WBNB_ADDRESS, account],
    }) as bigint;
	if (balance < amountWithDecimals) return toResult('Amount exceeds staked balance', true);

	await notify('Unstaking the asset...');

	const tx: EVM.types.TransactionParams = {
        target: STAKER_GATEWAY_ADDRESS,
        data: encodeFunctionData({
            abi: stakerGatewayAbi,
            functionName: 'unstakeNative',
            args: [amountWithDecimals, REFERRAL_ID],
        }),
    };

	const result = await sendTransactions({ chainId, account, transactions: [tx] });
    const stakeMessage = result.data[result.data.length - 1];

	return toResult(result.isMultisig ? stakeMessage.message : `Successfully unstaked ${amount} BNB. ${stakeMessage.message}`);
}
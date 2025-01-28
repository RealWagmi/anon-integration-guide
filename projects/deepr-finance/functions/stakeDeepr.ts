import { Address, encodeFunctionData, erc20Abi, parseUnits } from 'viem';
import {
	FunctionReturn,
	FunctionOptions,
	TransactionParams,
	toResult,
	getChainFromName,
} from '@heyanon/sdk';
import { supportedChains, ADDRESS } from '../constants';
import { rewardpoolAbi } from '../abis';

interface Props {
	chainName: string;
	account: Address;
    amount: string;
}

/**
 * Stake protocol's token DEEPR.
 * @param props - The stake parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Success message.
 */
export async function stakeDeepr(
	{ chainName, account, amount }: Props,
	{ sendTransactions, notify, getProvider }: FunctionOptions
): Promise<FunctionReturn> {
	// Check wallet connection
	if (!account) return toResult('Wallet not connected', true);

    await notify('Checking everything...');

	// Validate chain
	const chainId = getChainFromName(chainName);
	if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
	if (!supportedChains.includes(chainId)) return toResult(`Deepr Finance is not supported on ${chainName}`, true);

    const provider = getProvider(chainId);

    // Validate amount
    const amountWithDecimals = parseUnits(amount, 18);
    if (amountWithDecimals === 0n) return toResult('Amount must be greater than 0', true);
    const balance = await provider.readContract({
        address: ADDRESS.CONTRACT.DEEPR as Address,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [account],
    });
    if (balance < amountWithDecimals) return toResult('Amount exceeds your balance', true);

	await notify('Staking DEEPR...');

	// Prepare stake transaction
	const tx: TransactionParams = {
			target: ADDRESS.CONTRACT.REWARDPOOL as Address,
			data: encodeFunctionData({
					abi: rewardpoolAbi,
					functionName: 'deposit',
					args: [amountWithDecimals],
			}),
	};

	// Sign and send transaction
	const result = await sendTransactions({ chainId, account, transactions: [tx] });
	const stakeMessage = result.data[result.data.length - 1];

	return toResult(
        result.isMultisig ? 
        stakeMessage.message : 
        `Successfuly staked ${amount} DEEPR.`
    );
}
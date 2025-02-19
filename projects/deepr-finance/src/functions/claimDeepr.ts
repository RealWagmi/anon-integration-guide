import { Address, encodeFunctionData } from 'viem';
import { FunctionReturn, FunctionOptions, toResult, EVM, EvmChain } from '@heyanon/sdk';
import { CONTRACT, supportedChains } from '../constants';
import { rewardpoolAbi, unitrollerAbi } from '../abis';
const { getChainFromName } = EVM.utils;

interface Props {
	chainName: string;
	account: Address;
}

/**
 * Claim protocol's token DEEPR.
 * @param props - The claim parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Success message.
 */
export async function claimDeepr({ chainName, account }: Props, options: FunctionOptions): Promise<FunctionReturn> {
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

	const provider = getProvider(chainId);
	const transactions: EVM.types.TransactionParams[] = [];

	// Check if user has staked tokens
	const [, , rewardDebt, , ] = await provider.readContract({
        address: CONTRACT.REWARDPOOL,
        abi: rewardpoolAbi,
        functionName: 'userInfo',
        args: [account],
    }) as [bigint, bigint, bigint, boolean, bigint];
	const txHarvest: EVM.types.TransactionParams = {
		target: CONTRACT.REWARDPOOL,
		data: encodeFunctionData({
				abi: rewardpoolAbi,
				functionName: 'harvest',
		}),
	};
	if (rewardDebt > 0) {
		transactions.push(txHarvest);
	}

	await notify('Claiming DEEPR...');

	// Prepare claim transaction
	const txClaim: EVM.types.TransactionParams = {
			target: CONTRACT.UNITROLLER,
			data: encodeFunctionData({
					abi: unitrollerAbi,
					functionName: 'claimDeepr',
					args: [account],
			}),
	};
	transactions.push(txClaim);

	// Sign and send transaction
	const result = await sendTransactions({ chainId, account, transactions });
	const claimMessage = result.data[result.data.length - 1];

	return toResult(
        result.isMultisig ? 
        claimMessage.message : 
        `Successfuly claimed DEEPR.`
    );
}
import { Address, encodeFunctionData } from 'viem';
import {
	FunctionReturn,
	FunctionOptions,
	TransactionParams,
	toResult,
	getChainFromName,
} from '@heyanon/sdk';
import { supportedChains, TOKEN } from '../constants';
import { vaultAbi } from '../abis';

interface Props {
	chainName: string;
	account: Address;
    token: string;
}

/**
 * Claims asset from the Upshift partner vault.
 * @param props - The claim parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Success message.
 */
export async function claimAsset(
	{ chainName, account, token }: Props,
	{ sendTransactions, notify, getProvider }: FunctionOptions
): Promise<FunctionReturn> {
	// Check wallet connection
	if (!account) return toResult('Wallet not connected', true);

    await notify('Checking everything...');

	// Validate chain
	const chainId = getChainFromName(chainName);
	if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
	if (!supportedChains.includes(chainId)) return toResult(`Upshift is not supported on ${chainName}`, true);

    const tokenConfig = TOKEN[chainId][token.toUpperCase()];

    const provider = getProvider(chainId);

    const { year, month, day } = await provider.readContract({
        address: tokenConfig.vaultAddress,
        abi: vaultAbi,
        functionName: 'getWithdrawalEpoch',
    }) as { year: bigint; month: bigint; day: bigint };

	await notify('Claiming asset...');

	// Prepare claim transaction
	const tx: TransactionParams = {
			target: tokenConfig.vaultAddress,
			data: encodeFunctionData({
					abi: vaultAbi,
					functionName: 'claim',
					args: [year, month, day, account],
			}),
	};

	// Sign and send transaction
	const result = await sendTransactions({ chainId, account, transactions: [tx] });
	const claimMessage = result.data[result.data.length - 1];

	return toResult(result.isMultisig ? claimMessage.message : `Successfully claimed ${claimMessage.message[0][1]} ${token} from ${tokenConfig.name} vault.`);
}
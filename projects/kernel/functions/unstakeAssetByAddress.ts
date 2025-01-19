import { Address, encodeFunctionData, erc20Abi, parseUnits } from 'viem';
import {
  	FunctionReturn,
  	FunctionOptions,
  	TransactionParams,
  	toResult,
  	getChainFromName,
} from '@heyanon/sdk';
import { supportedChains, STAKER_GATEWAY_ADDRESS, ASSET_REGISTRY_ADDRESS, REFERRAL_ID } from '../constants';
import { assetRegistryAbi, stakerGatewayAbi } from '../abis';

interface Props {
  	chainName: string;
  	account: Address;
  	token: Address;
	amount: string;
}

/**
 * Unstakes an ERC20 asset by it's address from the protocol.
 * @param props - The unstake parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Success message.
 */
export async function unstakeAssetByAddress(
    { chainName, account, token, amount } : Props,
    { sendTransactions, notify, getProvider }: FunctionOptions
): Promise<FunctionReturn> {
    // Check wallet connection
	if (!account) return toResult('Wallet not connected', true);

	await notify('Checking everything...');

	// Validate chain
	const chainId = getChainFromName(chainName);
	if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
	if (!supportedChains.includes(chainId)) return toResult(`Kernel is not supported on ${chainName}`, true);

	// Validate token
	const provider = getProvider(chainId);
	const hasAsset = await provider.readContract({
        address: ASSET_REGISTRY_ADDRESS,
        abi: assetRegistryAbi,
        functionName: 'hasAsset',
        args: [token],
    }) as boolean;
	if (!hasAsset) return toResult('The asset is not supported', true);

	// Validate amount
    const decimals = await provider.readContract({
        address: token,
        abi: erc20Abi,
        functionName: 'decimals',
        args: [],
    })
	const amountWithDecimals = parseUnits(amount, decimals);
	if (amountWithDecimals === 0n) return toResult('Amount must be greater than 0', true);
	const balance = await provider.readContract({
        address: STAKER_GATEWAY_ADDRESS,
        abi: stakerGatewayAbi,
        functionName: 'balanceOf',
        args: [token, account],
    }) as bigint;
	if (balance < amountWithDecimals) return toResult('Amount exceeds staked balance', true);

	await notify('Unstaking the asset...');

	const tx: TransactionParams = {
        target: STAKER_GATEWAY_ADDRESS,
        data: encodeFunctionData({
            abi: stakerGatewayAbi,
            functionName: 'unstake',
            args: [token, amountWithDecimals, REFERRAL_ID],
        }),
    };

	const result = await sendTransactions({ chainId, account, transactions: [tx] });
    const stakeMessage = result.data[result.data.length - 1];

	return toResult(result.isMultisig ? stakeMessage.message : `Successfully unstaked ${amount} tokens. ${stakeMessage.message}`);
}
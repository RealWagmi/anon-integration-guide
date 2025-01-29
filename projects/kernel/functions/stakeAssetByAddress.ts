import { Address, encodeFunctionData, erc20Abi, parseUnits } from 'viem';
import {
  	FunctionReturn,
  	FunctionOptions,
  	TransactionParams,
  	toResult,
  	getChainFromName,
        checkToApprove
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
 * Stakes an ERC20 asset by it's address in the protocol.
 * @param props - The stake parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Success message.
 */
export async function stakeAssetByAddress(
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
	if (!hasAsset) return toResult('The asset cannot be staked', true);

	// Validate amount
    const decimals = await provider.readContract({
        address: token,
        abi: erc20Abi,
        functionName: 'decimals',
    })
	const amountWithDecimals = parseUnits(amount, decimals);
	if (amountWithDecimals === 0n) return toResult('Amount must be greater than 0', true);
	const balance = await provider.readContract({
        address: token,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [account],
    })
	if (balance < amountWithDecimals) return toResult('Amount exeeds your balance', true);

	await notify('Staking the asset...');

    const transactions: TransactionParams[] = [];
    
    // Approve the asset beforehand
    await checkToApprove({
        args: {
            account,
            target: token,
            spender: STAKER_GATEWAY_ADDRESS,
            amount: amountWithDecimals
        },
        transactions,
        provider,
    });

	const tx: TransactionParams = {
        target: STAKER_GATEWAY_ADDRESS,
        data: encodeFunctionData({
            abi: stakerGatewayAbi,
            functionName: 'stake',
            args: [token, amountWithDecimals, REFERRAL_ID],
        }),
    };
    transactions.push(tx);

	const result = await sendTransactions({ chainId, account, transactions });
    const stakeMessage = result.data[result.data.length - 1];

	return toResult(result.isMultisig ? stakeMessage.message : `Successfully staked ${amount} tokens. ${stakeMessage.message}`);
}
import { Address, encodeFunctionData, erc20Abi, parseUnits, zeroAddress } from 'viem';
import { FunctionReturn, FunctionOptions, toResult, EVM, EvmChain } from '@heyanon/sdk';
import { supportedChains, STAKER_GATEWAY_ADDRESS, ASSET_REGISTRY_ADDRESS, REFERRAL_ID } from '../constants';
import { assetRegistryAbi, stakerGatewayAbi } from '../abis';
const { getChainFromName, checkToApprove } = EVM.utils;

interface Props {
  	chainName: string;
  	account: Address;
  	token: string;
	amount: string;
}

/**
 * Stakes an ERC20 asset by it's symbol in the protocol.
 * @param props - The stake parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Success message.
 */
export async function stakeAssetBySymbol({chainName, account, token, amount } : Props, options: FunctionOptions): Promise<FunctionReturn> {
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

	// Validate token
	const provider = getProvider(chainId);

    const managedAssets = await provider.readContract({
        address: ASSET_REGISTRY_ADDRESS,
        abi: assetRegistryAbi,
        functionName: 'getAssets',
    }) as Address[];

    let assetAddress: Address = zeroAddress;
    for (const asset of managedAssets) {
        const assetSymbol = await provider.readContract({
            address: asset,
            abi: erc20Abi,
            functionName: 'symbol',
        });
        if (assetSymbol.toUpperCase() === token.toUpperCase()) {
            assetAddress = asset;
            break;
        }
    }
    if (assetAddress === zeroAddress) return toResult('The asset cannot be staked', true);

	// Validate amount
    const decimals = await provider.readContract({
        address: assetAddress,
        abi: erc20Abi,
        functionName: 'decimals',
    })
	const amountWithDecimals = parseUnits(amount, decimals);
	if (amountWithDecimals === 0n) return toResult('Amount must be greater than 0', true);
	const balance = await provider.readContract({
        address: assetAddress,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [account],
    })
	if (balance < amountWithDecimals) return toResult('Amount exceeds your balance', true);

	await notify('Staking the asset...');

    const transactions: EVM.types.TransactionParams[] = [];
    
    // Approve the asset beforehand
    await checkToApprove({
        args: {
            account,
            target: assetAddress,
            spender: STAKER_GATEWAY_ADDRESS,
            amount: amountWithDecimals
        },
        transactions,
        provider,
    });

	const tx: EVM.types.TransactionParams = {
        target: STAKER_GATEWAY_ADDRESS,
        data: encodeFunctionData({
            abi: stakerGatewayAbi,
            functionName: 'stake',
            args: [assetAddress, amountWithDecimals, REFERRAL_ID],
        }),
    };
    transactions.push(tx);

	const result = await sendTransactions({ chainId, account, transactions });
    const stakeMessage = result.data[result.data.length - 1];

	return toResult(result.isMultisig ? stakeMessage.message : `Successfully staked ${amount} ${token}. ${stakeMessage.message}`);
}
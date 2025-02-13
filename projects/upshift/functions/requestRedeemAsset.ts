import { Address, encodeFunctionData, erc20Abi, parseUnits } from 'viem';
import {
	FunctionReturn,
	FunctionOptions,
	TransactionParams,
	toResult,
	getChainFromName,
} from '@heyanon/sdk';
import { supportedChains, TOKEN, TokenConfig } from '../constants';
import { vaultAbi } from '../abis';

interface Props {
	chainName: string;
	account: Address;
	amount: string;
    token: string;
}

/**
 * Request redeem asset from the Upshift partner vault.
 * @param props - The redeem parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Success message.
 */
export async function requestRedeemAsset(
	{ chainName, account, amount, token }: Props,
	{ sendTransactions, notify, getProvider }: FunctionOptions
): Promise<FunctionReturn> {
	// Check wallet connection
	if (!account) return toResult('Wallet not connected', true);

    await notify('Checking everything...');

	// Validate chain
	const chainId = getChainFromName(chainName);
	if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
	if (!supportedChains.includes(chainId)) return toResult(`Upshift is not supported on ${chainName}`, true);

    // Validate token
    let tokenConfig: TokenConfig | undefined = (TOKEN as Record<number, Record<string, TokenConfig>>)[chainId]?.[token.toUpperCase()];
    let isUnderlyingAsset = true;
    if (!tokenConfig) {
		// If not found, search by vaultSymbol
		tokenConfig = Object.values((TOKEN as Record<number, Record<string, TokenConfig>>)[chainId]).find(
			(config) => config.vaultSymbol.toUpperCase() === token.toUpperCase()
		);
        isUnderlyingAsset = false;
		if (!tokenConfig) return toResult(`Asset is not supported`, true);
	}
    const vault = tokenConfig.vaultAddress;

    const provider = getProvider(chainId);
    
    // Validate amount
    let decimals;
    if (isUnderlyingAsset) {
        decimals = tokenConfig.decimals;
    } else {
        decimals = tokenConfig.vaultDecimals;
    }

    let amountWithDecimals = parseUnits(amount, decimals);
    if (amountWithDecimals === 0n) return toResult('Amount must be greater than 0', true);
    if (isUnderlyingAsset) {
        amountWithDecimals = await provider.readContract({
            address: vault,
            abi: vaultAbi,
            functionName: 'convertToShares',
            args: [amountWithDecimals],
        }) as bigint;
    }
    const balance = await provider.readContract({
        address: vault,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [account],
    });
    if (balance < amountWithDecimals) return toResult('Amount exceeds your balance', true);

    const timelock = (await provider.readContract({
        address: vault,
        abi: vaultAbi,
        functionName: 'lagDuration',
    }) as bigint) / 3600n;

    await notify('Making request...');

	// Prepare request transaction
	const tx: TransactionParams = {
			target: vault,
			data: encodeFunctionData({
					abi: vaultAbi,
					functionName: 'requestRedeem',
					args: [amountWithDecimals, account, account],
			}),
	};

	// Sign and send transaction
	const result = await sendTransactions({ chainId, account, transactions: [tx] });
	const requestMessage = result.data[result.data.length - 1];

	return toResult(
        result.isMultisig ? 
        requestMessage.message : 
        `Successfully made request for ${amount} ${token} from ${tokenConfig.name} vault. Claim is available in ${timelock} hour(s)`
    );
}
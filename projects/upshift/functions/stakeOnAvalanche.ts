import { Address, encodeFunctionData, erc20Abi, parseUnits } from 'viem';
import {
	FunctionReturn,
	FunctionOptions,
	TransactionParams,
	toResult,
	getChainFromName,
    checkToApprove,
    ChainId
} from '@heyanon/sdk';
import { TOKEN, TokenConfig } from '../constants';
import { stakeAbi } from '../abis';

interface Props {
	chainName: string;
	account: Address;
	amount: string;
    token: string;
}

/**
 * Stakes Upshift LP on Avalanche into the vault.
 * @param props - The stake parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Success message.
 */
export async function stakeOnAvalanche(
	{ chainName, account, amount, token }: Props,
	{ sendTransactions, notify, getProvider }: FunctionOptions
): Promise<FunctionReturn> {
	// Check wallet connection
	if (!account) return toResult('Wallet not connected', true);

    await notify('Checking everything...');

	// Validate chain
	const chainId = getChainFromName(chainName);
	if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
	if (chainId !== ChainId.AVALANCHE) return toResult(`Staking LP tokens is not supported on ${chainName}`, true);

    // Validate token
    const tokenConfig = Object.values((TOKEN as Record<number, Record<string, TokenConfig>>)[chainId]).find(
        (config) => config.vaultSymbol.toUpperCase() === token.toUpperCase()
    );
    if (!tokenConfig) return toResult(`Asset is not supported`, true);
    const vault = tokenConfig.vaultAddress;

    const provider = getProvider(chainId);

    // Validate amount
    const decimals = tokenConfig.vaultDecimals;
    const amountWithDecimals = parseUnits(amount, decimals);
    if (amountWithDecimals === 0n) return toResult('Amount must be greater than 0', true);
    const balance = await provider.readContract({
        address: vault,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [account],
    });
    if (balance < amountWithDecimals) return toResult('Amount exceeds your balance', true);

    await notify('Staking asset...');

    const transactions: TransactionParams[] = [];

    // Approve the asset beforehand
    await checkToApprove({
        args: {
            account,
            target: vault,
            spender: tokenConfig.stakeAddress as Address,
            amount: amountWithDecimals
        },
        transactions,
        provider,
    });

	// Prepare stake transaction
	const tx: TransactionParams = {
			target: tokenConfig.stakeAddress as Address,
			data: encodeFunctionData({
					abi: stakeAbi,
					functionName: 'stake',
					args: [amountWithDecimals],
			}),
	};
	transactions.push(tx);

	// Sign and send transaction
	const result = await sendTransactions({ chainId, account, transactions });
	const stakeMessage = result.data[result.data.length - 1];

	return toResult(
        result.isMultisig ? 
        stakeMessage.message : 
        `Successfully staked ${amount} ${token}.`
    );
}
import { Address, encodeFunctionData, parseUnits } from 'viem';
import { FunctionReturn, FunctionOptions, EVM, toResult, EvmChain } from '@heyanon/sdk';
import { TOKEN } from '../constants';
import { stakeAbi } from '../abis';
const { getChainFromName } = EVM.utils;
const { ChainIds } = EVM.constants;

interface Props {
	chainName: string;
	account: Address;
	amount: string;
    token: string;
}

/**
 * Unstakes Upshift LP on Avalanche from the vault.
 * @param props - The unstake parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Success message.
 */
export async function unstakeOnAvalanche({ chainName, account, amount, token }: Props, options: FunctionOptions): Promise<FunctionReturn> {
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
	if (chainId !== ChainIds.avalanche) return toResult(`Staking LP tokens is not supported on ${chainName}`, true);

    // Validate token
    const tokenConfig = Object.values(TOKEN[chainId]).find(
        (config) => config.vaultSymbol.toUpperCase() === token.toUpperCase()
    );
    if (!tokenConfig) return toResult(`Asset is not supported`, true);

    const provider = getProvider(chainId);

    // Validate amount
    const decimals = tokenConfig.vaultDecimals;
    const amountWithDecimals = parseUnits(amount, decimals);
    if (amountWithDecimals === 0n) return toResult('Amount must be greater than 0', true);
    const balance = await provider.readContract({
        address: tokenConfig.stakeAddress as Address,
        abi: stakeAbi,
        functionName: 'balanceOf',
        args: [account],
    }) as bigint;
    if (balance < amountWithDecimals) return toResult('Amount exceeds your balance', true);

    await notify('Unstaking asset...');

	// Prepare unstake transaction
	const tx: EVM.types.TransactionParams = {
			target: tokenConfig.stakeAddress as Address,
			data: encodeFunctionData({
					abi: stakeAbi,
					functionName: 'withdraw',
					args: [amountWithDecimals],
			}),
	};

	// Sign and send transaction
	const result = await sendTransactions({ chainId, account, transactions: [tx] });
	const unstakeMessage = result.data[result.data.length - 1];

	return toResult(
        result.isMultisig ? 
        unstakeMessage.message : 
        `Successfully unstaked ${amount} ${token}.`
    );
}
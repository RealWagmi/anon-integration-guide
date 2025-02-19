import { Address, encodeFunctionData } from 'viem';
import { FunctionReturn, FunctionOptions, toResult, EVM, EvmChain } from '@heyanon/sdk';
import { TOKEN } from '../constants';
import { stakeAbi } from '../abis';
const { getChainFromName } = EVM.utils;
const { ChainIds } = EVM.constants;

interface Props {
	chainName: string;
	account: Address;
    token: string;
}

/**
 * Redeem rewards from Upshift LP on Avalanche.
 * @param props - The redeem parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Success message.
 */
export async function redeemRewardOnAvalanche({ chainName, account, token }: Props, options: FunctionOptions): Promise<FunctionReturn> {
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
    const earned = await provider.readContract({
        address: tokenConfig.stakeAddress as Address,
        abi: stakeAbi,
        functionName: 'earned',
        args: [account],
    });

    await notify('Redeeming reward asset...');

	// Prepare unstake transaction
	const tx: EVM.types.TransactionParams = {
			target: tokenConfig.stakeAddress as Address,
			data: encodeFunctionData({
					abi: stakeAbi,
					functionName: 'getReward',
			}),
	};

	// Sign and send transaction
	const result = await sendTransactions({ chainId, account, transactions: [tx] });
	const redeemMessage = result.data[result.data.length - 1];

	return toResult(
        result.isMultisig ? 
        redeemMessage.message : 
        `Successfully claimed ${earned} AVAX.`
    );
}
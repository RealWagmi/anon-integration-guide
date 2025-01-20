import { Address, encodeFunctionData, erc20Abi, parseUnits } from 'viem';
import {
	FunctionReturn,
	FunctionOptions,
	TransactionParams,
	toResult,
	getChainFromName,
    checkToApprove
} from '@heyanon/sdk';
import { SCETH_SONIC_ADDRESS, STKSCETH_SONIC_TELLER_ADDRESS, supportedChains } from '../constants';
import { stkscEthTellerAbi } from '../abis';

interface Props {
	chainName: string;
	account: Address;
	amount: string;
}

/**
 * Stakes scETH in the Rings protocol in exchange for stkscETH.
 * @param props - The stake parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Amount of stkscETH tokens.
 */
export async function stakeScEth(
	{ chainName, account, amount }: Props,
	{ sendTransactions, notify, getProvider }: FunctionOptions
): Promise<FunctionReturn> {
	// Check wallet connection
	if (!account) return toResult('Wallet not connected', true);

    await notify('Checking everything...');

	// Validate chain
	const chainId = getChainFromName(chainName);
	if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
	if (!supportedChains.includes(chainId)) return toResult(`Rings is not supported on ${chainName}`, true);

    // Validate amount
    const provider = getProvider(chainId);
    const amountWithDecimals = parseUnits(amount, 18);
    if (amountWithDecimals === 0n) return toResult('Amount must be greater than 0', true);
    const balance = await provider.readContract({
        address: SCETH_SONIC_ADDRESS,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [account],
    })
    if (balance < amountWithDecimals) return toResult('Amount exceeds your balance', true);

    await notify('Staking scETH...');

    const transactions: TransactionParams[] = [];

    // Approve the asset beforehand
    await checkToApprove({
        args: {
            account,
            target: SCETH_SONIC_ADDRESS,
            spender: STKSCETH_SONIC_TELLER_ADDRESS,
            amount: amountWithDecimals
        },
        transactions,
        provider,
    });
    
	// Prepare stake transaction
	const tx: TransactionParams = {
			target: STKSCETH_SONIC_TELLER_ADDRESS,
			data: encodeFunctionData({
					abi: stkscEthTellerAbi,
					functionName: 'deposit',
					args: [SCETH_SONIC_ADDRESS, amountWithDecimals, 0],
			}),
	};
	transactions.push(tx);

	// Sign and send transaction
	const result = await sendTransactions({ chainId, account, transactions });
	const stakeMessage = result.data[result.data.length - 1];

	return toResult(result.isMultisig ? stakeMessage.message : `Successfully staked scETH for ${stakeMessage.message} stkscETH`);
}
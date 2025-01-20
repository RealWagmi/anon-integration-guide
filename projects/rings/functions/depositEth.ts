import { Address, encodeFunctionData, erc20Abi, parseUnits } from 'viem';
import {
	FunctionReturn,
	FunctionOptions,
	TransactionParams,
	toResult,
	getChainFromName,
    checkToApprove
} from '@heyanon/sdk';
import { SCETH_SONIC_TELLER_ADDRESS, supportedChains, WETH_ADDRESS } from '../constants';
import { scEthTellerAbi } from '../abis';

interface Props {
	chainName: string;
	account: Address;
	amount: string;
}

/**
 * Deposits WETH into the Rings protocol in exchange for scETH.
 * @param props - The deposit parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Amount of scETH tokens.
 */
export async function depositEth(
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
        address: WETH_ADDRESS,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [account],
    })
    if (balance < amountWithDecimals) return toResult('Amount exceeds your balance', true);

    await notify('Depositing WETH...');

    const transactions: TransactionParams[] = [];

    // Approve the asset beforehand
    await checkToApprove({
        args: {
            account,
            target: WETH_ADDRESS,
            spender: SCETH_SONIC_TELLER_ADDRESS,
            amount: amountWithDecimals
        },
        transactions,
        provider,
    });
    
	// Prepare deposit transaction
	const tx: TransactionParams = {
			target: SCETH_SONIC_TELLER_ADDRESS,
			data: encodeFunctionData({
					abi: scEthTellerAbi,
					functionName: 'deposit',
					args: [WETH_ADDRESS, amountWithDecimals, 0],
			}),
	};
	transactions.push(tx);

	// Sign and send transaction
	const result = await sendTransactions({ chainId, account, transactions });
	const depositMessage = result.data[result.data.length - 1];

	return toResult(result.isMultisig ? depositMessage.message : `Successfully deposited WETH for ${depositMessage.message} scETH`);
}
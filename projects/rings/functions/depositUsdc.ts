import { Address, encodeFunctionData, erc20Abi, parseUnits } from 'viem';
import {
	FunctionReturn,
	FunctionOptions,
	TransactionParams,
	toResult,
	getChainFromName,
    checkToApprove
} from '@heyanon/sdk';
import { SCUSD_SONIC_TELLER_ADDRESS, supportedChains, USDC_ADDRESS } from '../constants';
import { scUsdTellerAbi } from '../abis';

interface Props {
	chainName: string;
	account: Address;
	amount: string;
}

/**
 * Deposits USDC into the Rings protocol in exchange for scUSD.
 * @param props - The deposit parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Amount of scUSD tokens.
 */
export async function depositUsdc(
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
    const amountWithDecimals = parseUnits(amount, 6);
    if (amountWithDecimals === 0n) return toResult('Amount must be greater than 0', true);
    const balance = await provider.readContract({
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [account],
    })
    if (balance < amountWithDecimals) return toResult('Amount exceeds your balance', true);

    await notify('Depositing USDC...');

    const transactions: TransactionParams[] = [];

    // Approve the asset beforehand
    await checkToApprove({
        args: {
            account,
            target: USDC_ADDRESS,
            spender: SCUSD_SONIC_TELLER_ADDRESS,
            amount: amountWithDecimals
        },
        transactions,
        provider,
    });
    
	// Prepare deposit transaction
	const tx: TransactionParams = {
			target: SCUSD_SONIC_TELLER_ADDRESS,
			data: encodeFunctionData({
					abi: scUsdTellerAbi,
					functionName: 'deposit',
					args: [USDC_ADDRESS, amountWithDecimals, 0],
			}),
	};
	transactions.push(tx);

	// Sign and send transaction
	const result = await sendTransactions({ chainId, account, transactions });
	const depositMessage = result.data[result.data.length - 1];

	return toResult(result.isMultisig ? depositMessage.message : `Successfully deposited USDC for ${depositMessage.message} scUSD`);
}
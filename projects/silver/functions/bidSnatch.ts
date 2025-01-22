import { Address, encodeFunctionData, parseUnits } from 'viem';
import {
  FunctionReturn,
  FunctionOptions,
  TransactionParams,
  toResult,
  getChainFromName,
  checkToApprove
} from '@heyanon/sdk';
import { supportedChains, SILVER_ADDRESS, SILVER_FEES_ADDRESS } from '../constants';
import { silverFeesAbi } from '../abis';

interface Props {
  chainName: string;
  account: Address;
  amountToBurn: string;
  poolToSteal: Address;
}

/**
 * Bid with snatch to an SilverSwap pool.
 * @param props - The snatch parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Transaction result.
 */
export async function bidSnatch(
	{ 
		chainName, 
		account, 
		amountToBurn,
		poolToSteal
	}: Props,
	{ sendTransactions, notify, getProvider }: FunctionOptions
  ): Promise<FunctionReturn> {
	// Check wallet connection
	if (!account) return toResult('Wallet not connected', true);
  
	// Validate chain
	const chainId = getChainFromName(chainName);
	if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
	if (!supportedChains.includes(chainId))
	  return toResult(`Protocol is not supported on ${chainName}`, true);
  
	// Validate pool address
	if (!poolToSteal) return toResult('poolToSteal address is required', true);
	
	// Convert amountToBurn to BigInt
	const amountToBurnBn = parseUnits(amountToBurn, 18);
	
	// Validate amount
    if (amountToBurnBn <= 0n) return toResult('amountToBurn must be greater than 0', true);
	
	await notify('Preparing to bid on Snatch...');
	
	const provider = getProvider(chainId);
	const transactions: TransactionParams[] = [];
  
	// Get the current amount of bids
	let amountToApprove = await provider.readContract({
		address: SILVER_FEES_ADDRESS,
		abi: silverFeesAbi,
		functionName: 'getAllBids',
		args: [account]
	});

	// Get the amount already bided
	const amountAlreadyBided = await provider.readContract({
		address: SILVER_FEES_ADDRESS,
		abi: silverFeesAbi,
		functionName: 'snatchLastBid',
		args: [account, poolToSteal]
	});

	// Add amountToBurn to the total already bided amount
	amountToApprove = amountToApprove - amountAlreadyBided + amountToBurnBn;

	// Check and prepare approve transaction if needed
	await checkToApprove({
		args: {
			account,
			target: SILVER_ADDRESS,
			spender: SILVER_FEES_ADDRESS,
			amount: amountToApprove
		},
		provider,
		transactions
	  }
	);
  
	// Prepare bid transaction
	const tx: TransactionParams = {
	  target: SILVER_FEES_ADDRESS,
	  data: encodeFunctionData({
		abi: silverFeesAbi,
		functionName: 'snatch',
		args: [amountToBurnBn, poolToSteal],
	  }),
	};
	transactions.push(tx);
  
	await notify('Waiting for transaction confirmation...');
  
	// Sign and send transaction
	const result = await sendTransactions({ chainId, account, transactions });
	const bidMessage = result.data[result.data.length - 1];
  
	return toResult(
	  result.isMultisig ? bidMessage.message : `Successfully bided ${amountToBurn} with snatch on ${poolToSteal} pool. ${bidMessage.message}`
	);
  }
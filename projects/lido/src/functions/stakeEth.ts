import { Address, encodeFunctionData, parseEther } from 'viem';
import { supportedChains, stETH_ADDRESS, REFERRAL_ADDRESS } from '../constants';
import stEthAbi from '../abis/stEthAbi';
import { EVM, EvmChain, FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
const { getChainFromName } = EVM.utils;

interface Props {
    chainName: string; // Blockchain network name
    account: Address; // User's wallet address
    amount: string; // ETH amount to stake
}

/**
 * Stakes ETH into the Lido protocol and receives stETH in return.
 * @param {Props} params - An object containing the chain name, account address, and stake amount.
 * @param {FunctionOptions} options - An object containing `sendTransactions`, `getProvider`, and `notify` utilities.
 * @returns {Promise<FunctionReturn>} - A promise that resolves to a success message or an error message.
 */
export async function stakeETH({ chainName, account, amount }: Props, options: FunctionOptions): Promise<FunctionReturn> {
    const {
        evm: { sendTransactions },
        notify,
    } = options;

    if (!account) return toResult('Wallet not connected', true);

    // Validate amount
    if (!amount || typeof amount !== 'string' || isNaN(Number(amount)) || Number(amount) <= 0) {
        return toResult('Amount must be a valid number greater than 0', true);
    }
    // Validate chain
    const chainId = getChainFromName(chainName as EvmChain);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Lido protocol is not supported on ${chainName}`, true);

    try {
        const amountInWei = parseEther(amount);

        await notify(`Preparing to stake ${amount} ETH...`);

        const tx: EVM.types.TransactionParams = {
            target: stETH_ADDRESS, // Lido contract address
            data: encodeFunctionData({
                abi: stEthAbi,
                functionName: 'submit',
                args: [REFERRAL_ADDRESS], // ✅ Passing referral address (required)
            }),
            value: amountInWei, // ✅ ETH is passed correctly
        };

        await notify('Waiting for transaction confirmation...');

        const result = await sendTransactions({
            chainId, // Chain ID of the network
            account, // User's wallet address
            transactions: [tx], // List of transactions to send
        });

        const stakeMessage = result.data[result.data.length - 1];

        return toResult(result.isMultisig ? stakeMessage.message : `Successfully staked ${amount} ETH. ${stakeMessage.message}`);
    } catch (error) {
        return toResult(`Failed to stake ETH: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
    }
}

import { Address, encodeFunctionData, parseUnits, formatUnits } from 'viem';
import { FunctionReturn, FunctionOptions, toResult, EVM, EvmChain } from '@heyanon/sdk';
import { supportedChains, STS_ADDRESS, MIN_DEPOSIT_IN_WEI } from '../constants';
import { stsAbi } from '../abis';

interface Props {
    chainName: string;
    account: Address;
    amount: string;
}

/**
 * Stakes the specified amount of Sonic tokens (S) into the Beets protocol by sending them
 * to the staking contract in exchange for staked Sonic (stS).
 *
 * @param {Object} props - The function input parameters
 * @param {string} props.chainName - Name of the blockchain network
 * @param {Address} props.account - The user's address that will stake tokens
 * @param {string} props.amount - The amount of Sonic (S) to stake, in decimal format
 * @param {FunctionOptions} context - Holds EVM utilities and a notifier
 * @returns {Promise<FunctionReturn>} A message confirming the stakes or an error description
 */
export async function stake({ chainName, account, amount }: Props, { evm: { sendTransactions }, notify }: FunctionOptions): Promise<FunctionReturn> {
    if (!account) return toResult('Wallet not connected', true);

    const chainId = EVM.utils.getChainFromName(chainName as EvmChain);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Beets protocol is not supported on ${chainName}`, true);

    await notify(`Preparing to stake ${amount} S...`);

    const amountInWei = parseUnits(amount, 18);
    if (amountInWei === 0n) return toResult('Amount must be greater than 0', true);
    if (amountInWei < parseUnits('0.01', 18)) return toResult('Amount must be greater than 0.01 S', true);
    if (amountInWei < MIN_DEPOSIT_IN_WEI) return toResult(`Amount must be greater than ${formatUnits(MIN_DEPOSIT_IN_WEI, 18)} S`, true);

    const transactions: EVM.types.TransactionParams[] = [];

    // Prepare stake transaction
    const tx: EVM.types.TransactionParams = {
        target: STS_ADDRESS,
        data: encodeFunctionData({
            abi: stsAbi,
            functionName: 'deposit',
            args: [],
        }),
        value: amountInWei,
    };
    transactions.push(tx);

    await notify('Sending transaction...');

    const result = await sendTransactions({ chainId, account, transactions });
    const message = result.data[result.data.length - 1].message;
    return toResult(result.isMultisig ? message : `Successfully staked ${amount} S. ${message}`);
}

import { Address, encodeFunctionData } from 'viem';
import { FunctionReturn, FunctionOptions, TransactionParams, toResult, getChainFromName } from '@heyanon/sdk';
import { supportedChains } from '../../constants';
import { superVoterAbi } from '../../abis/superVoterAbi';

interface Props {
    chainName: string;
    account: Address;
    superVoterAddress: Address;
    managerAddress: Address;
}

/**
 * Delegates manager rights for a Super Voter contract
 * @param props - The delegation parameters
 * @param options - System tools for blockchain interactions
 * @returns Transaction result
 */
export async function delegateSuperVoterManager(
    { chainName, account, superVoterAddress, managerAddress }: Props,
    { sendTransactions, notify }: FunctionOptions
): Promise<FunctionReturn> {
    // Check wallet connection
    if (!account) return toResult('Wallet not connected', true);

    // Validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Equalizer is not supported on ${chainName}`, true);

    // Validate addresses
    if (!superVoterAddress) return toResult('Super Voter address is required', true);
    if (!managerAddress) return toResult('Manager address is required', true);

    await notify('Preparing to delegate Super Voter manager...');

    const transactions: TransactionParams[] = [];

    const delegateTx: TransactionParams = {
        target: superVoterAddress,
        data: encodeFunctionData({
            abi: superVoterAbi,
            functionName: 'setManager',
            args: [managerAddress],
        }),
    };
    transactions.push(delegateTx);

    await notify('Waiting for transaction confirmation...');

    const result = await sendTransactions({ chainId, account, transactions });
    const delegateMessage = result.data[result.data.length - 1];

    return toResult(result.isMultisig ? delegateMessage.message : `Successfully delegated Super Voter manager. ${delegateMessage.message}`);
}

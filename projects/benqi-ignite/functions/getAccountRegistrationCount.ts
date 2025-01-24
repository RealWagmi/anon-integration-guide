import { FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { Address } from 'viem';
import igniteAbi from '../abis/ignite';
import { IGNITE_ADDRESS } from '../constants';
import { parseWallet } from '../utils';

type Props = {
    chainName: string;
    account: Address;
};

/**
 * Get count of registrations made by the given account.
 * @param props - The function `Props`
 * @param tools - System tools for blockchain interactions
 * @returns Transaction result
 */
export async function getAccountRegistrationCount(props: Props, { sendTransactions, notify, getProvider }: FunctionOptions): Promise<FunctionReturn> {
    const wallet = parseWallet(props);

    if (!wallet.success) {
        return toResult(wallet.errorMessage, true);
    }

    const { account, chainId } = wallet.data;

    const provider = getProvider(chainId);

    const registrationCount = await provider.readContract({
        address: IGNITE_ADDRESS,
        abi: igniteAbi,
        functionName: 'getAccountRegistrationCount',
        args: [account],
    });

    return toResult(`Registration count: ${registrationCount}`);
}

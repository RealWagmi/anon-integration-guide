import { FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { Address } from 'viem';
import igniteAbi from '../abis/ignite';
import { IGNITE_ADDRESS } from '../constants';
import { parseRange, parseWallet } from '../utils/parse';

type Props = {
    chainName: string;
    account: Address;
    from: number;
    to: number;
};

/**
 * Lists registrations made by the given account.
 * @param props - The function {@link Props}
 * @param tools - System tools for blockchain interactions
 * @returns Transaction result
 */
export async function getRegistrationsByAccount(props: Props, { getProvider }: FunctionOptions): Promise<FunctionReturn> {
    const wallet = parseWallet(props);

    if (!wallet.success) {
        return toResult(wallet.errorMessage, true);
    }

    const { account, chainId } = wallet.data;

    const range = parseRange(props);

    if (!range.success) {
        return toResult(range.errorMessage, true);
    }

    const provider = getProvider(chainId);

    const registrations = await provider.readContract({
        address: IGNITE_ADDRESS,
        abi: igniteAbi,
        functionName: 'getRegistrationsByAccount',
        args: [account, range.data.from, range.data.to],
    });

    return toResult(`Registration made by ${account}:\n${JSON.stringify(registrations, null, 2)}`);
}

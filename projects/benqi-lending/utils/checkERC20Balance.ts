import { Address, erc20Abi, formatUnits, PublicClient } from 'viem';

interface Props {
    readonly args: {
        readonly token: Address;
        readonly account: Address;
        readonly amount: bigint;
        readonly decimals: number;
    };
    readonly provider: PublicClient;
}

export async function checkERC20Balance({ args, provider }: Props): Promise<void> {
    const { token, account, amount, decimals } = args;

    const balance = await provider.readContract({
        address: token,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [account],
    });

    if (balance < amount) {
        throw new Error(`Insufficient balance. User has ${formatUnits(balance, decimals)} and wants to transfer ${formatUnits(amount, decimals)}.`);
    }
}

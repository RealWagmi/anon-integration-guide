import { type Address, formatUnits, type PublicClient } from 'viem';

interface Props {
    readonly args: {
        readonly account: Address;
        readonly amount: bigint;
        readonly decimals: number;
    };
    readonly provider: PublicClient;
}

export async function checkBalance({ args, provider }: Props): Promise<void> {
    const { account, amount, decimals } = args;

    const balance = await provider.getBalance({
        address: account,
    });

    if (balance < amount) {
        throw new Error(`Insufficient balance. User has ${formatUnits(balance, decimals)} and wants to transfer ${formatUnits(amount, decimals)}.`);
    }
}

export interface IPVotingEscrow {
    lock(amount: bigint, lockDuration: bigint): Promise<void>;

    lockedBalance(user: string): Promise<{
        amount: bigint;
        end: bigint;
    }>;
} 
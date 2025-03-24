import axios from 'axios';

interface SiloUserPosition {
    siloAddress: string;
    collateralBalance: bigint;
    debtBalance: bigint;
}

interface UserPosition {
    silo0: SiloUserPosition;
    silo1: SiloUserPosition;
    healthFactor: bigint;
    borrowPowerUsed: bigint;
}

export async function fetchUserPosition(chainName: string, account: string, marketId: string): Promise<UserPosition> {
    try {
        const response = await axios.get(`https://v2.silo.finance/api/lending-market/${chainName}/${marketId}?user=${account}`);
        return {
            silo0: {
                siloAddress: response.data.silo0.siloAddress,
                collateralBalance: BigInt(response.data.silo0.collateralBalance),
                debtBalance: BigInt(response.data.silo0.debtBalance),
            },
            silo1: {
                siloAddress: response.data.silo1.siloAddress,
                collateralBalance: BigInt(response.data.silo1.collateralBalance),
                debtBalance: BigInt(response.data.silo1.debtBalance),
            },
            healthFactor: BigInt(response.data.healthFactor),
            borrowPowerUsed: BigInt(response.data.borrowPowerUsed),
        };
    } catch (e) {
        throw new Error(`Failed to fetch user position: ${e.message}`);
    }
}

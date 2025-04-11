import axios from 'axios';

export async function _getAllVaults(): Promise<any> {
    try {
        const res = await axios.get('https://stats-data.hyperliquid.xyz/Mainnet/vaults');
        console.log(res.data[0].summary);
        return res.data
            .filter((e: any) => !e.summary.isClosed)
            .map((e: any) => ({
                name: e.summary.name,
                vaultAddress: e.summary.vaultAddress,
                leader: e.summary.leader,
                tvl: e.summary.tvl,
                createTimeMillis: e.summary.createTimeMillis
            }));
    } catch (e) {
        return [];
    }
}

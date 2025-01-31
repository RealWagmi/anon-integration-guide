import { Type } from '@sinclair/typebox';
import { baseApiEndpoint } from './constants';
import { NftV4Response, veNftV4ResponseSchema } from './schemas';
import { Value } from '@sinclair/typebox/value';

// ... existing code ...

const walletNftsResponseSchema = Type.Object({
    success: Type.Boolean(),
    data: veNftV4ResponseSchema,
});

export async function getWalletNfts(address: string): Promise<NftV4Response> {
    try {
        const response = await fetch(`${baseApiEndpoint}/wallet/${address}/nfts`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const rawData = await response.json();

        const parsedData = Value.Parse(walletNftsResponseSchema, rawData);

        if (!parsedData.success) {
            throw new Error('API response indicates failure');
        }

        return parsedData.data;
    } catch (error) {
        console.error('Error fetching wallet NFTs:', error);
        return [];
    }
}

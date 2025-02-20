import { erc20Abi, PublicClient, Address, parseUnits } from 'viem';

export interface TokenInfo {
    decimals: number;
    symbol: string;
}

export async function getTokenInfo(token: Address, provider: PublicClient): Promise<TokenInfo | null> {
    try {
        const decimals = await provider.readContract({
            address: token,
            abi: erc20Abi,
            functionName: 'decimals',
        });

        const symbol = await provider.readContract({
            address: token,
            abi: erc20Abi,
            functionName: 'symbol',
        });

        return { decimals, symbol };
    } catch (error) {
        return null;
    }
}

type ParseResult = { success: true; result: number } | { success: false; message: string };

export function slippageToleranceToBips(tolerance: string): ParseResult {
    if (!Number.isFinite(tolerance)) {
        return { success: false, message: 'slippage tolerance must be finite number.' };
    }

    const toleranceAsNumber = Number(tolerance);
    if (toleranceAsNumber < 0) {
        return { success: false, message: 'slippage tolerance must be greater than 0.' };
    }

    if (toleranceAsNumber > 100) {
        return { success: false, message: 'slippage tolerance must be less than 100.' };
    }

    return { success: true, result: Number(parseUnits(tolerance, 2).toString()) };
}

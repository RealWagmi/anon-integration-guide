import { Address, formatUnits, parseUnits } from 'viem';
import { FunctionReturn, FunctionOptions, toResult, getChainFromName } from '@heyanon/sdk';
import { supportedChains, fetchBridgeQuote, BTC_CHAIN_ID } from '../constants';

interface Props {
    srcChainName: string;
    destChainName: string;
    srcToken: Address;
    destToken: Address;
    slippage: number;
    amount: string;
    srcTokenDecimals: number;
    destTokenDecimals: number;
}

/**
 * Get bridge quote for cross-chain transaction.
 * @param srcChainName - Source chain
 * @param destChainName - Destination chain
 * @param srcToken - Source token address
 * @param destToken - Destination token address
 * @param slippage - Slippage percentage
 * @param amount - Amount to bridge
 * @param srcTokenDecimals - Decimals of source token
 * @param destTokenDecimals - Decimals of destination token
 * @returns Bridge quote
 */
export async function getBridgeQuote(
    { srcChainName, destChainName, srcToken, destToken, slippage, amount, srcTokenDecimals, destTokenDecimals }: Props,
    { notify }: FunctionOptions,
): Promise<FunctionReturn> {
    try {
        const srcChainId = getChainFromName(srcChainName);
        let destChainId;
        if (destChainName.toLowerCase() === 'bitcoin') {
            destChainId = BTC_CHAIN_ID;
        } else {
            destChainId = getChainFromName(destChainName);
        }

        if (!supportedChains.includes(srcChainId)) return toResult(`Eddy Finance is not supported on ${srcChainName}`, true);
        if (!supportedChains.includes(destChainId)) return toResult(`Eddy Finance is not supported on ${destChainName}`, true);

        // Validate amount
        const amountInWei = parseUnits(amount, srcTokenDecimals);
        if (amountInWei === 0n) return toResult('Amount must be greater than 0', true);

        await notify('Fetching bridge quote 🚀');

        // Get bridge quote
        const resp = await fetchBridgeQuote(srcToken, destToken, amount, slippage, srcChainId, destChainId);

        const estimatedRecievedAmount = BigInt(resp.estimatedRecievedAmount);

        const outputAmount = formatUnits(estimatedRecievedAmount, destTokenDecimals);

        return toResult(`Estimate output token received is : ${outputAmount}`);
    } catch (error) {
        console.error('Quote Error', error);
        return toResult('Failed to fetch Quote for transaction. Please try again.', true);
    }
}

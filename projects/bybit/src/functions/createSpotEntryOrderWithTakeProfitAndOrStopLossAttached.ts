import { FunctionReturn, toResult } from '@heyanon/sdk';
import { FunctionOptionsWithExchange } from '../overrides';
import { createSpotEntryOrderWithTakeProfitAndOrStopLossAttached as createSpotEntryOrderWithTakeProfitAndOrStopLossAttachedHelper } from '../helpers/exchange';
import { formatOrderSingleLine } from '../helpers/format';
import { getOrderById } from '../helpers/exchange';
import { getMarketLastPriceBySymbol, getMarketObject } from '../helpers/markets';
import { convertToBaseAmount, convertTargetToAbsolutePrice } from '../helpers/amount';
import { LIMIT_PRICE_TOLERANCE } from '../constants';

interface Props {
    market: string;
    side: 'buy' | 'sell';
    amount: number;
    amountCurrency: 'base' | 'spend';
    takeProfitPrice: number | null;
    takeProfitType: 'absolute' | 'percentage' | null;
    stopLossPrice: number | null;
    stopLossType: 'absolute' | 'percentage' | null;
    limitPrice: number | null;
}

/**
 * Send an order to create a spot entry order with a TP/SL order attached to it.
 *
 * @param props - The function input parameters
 * @param props.market - Symbol of the market to trade, for example "BTC/USDT" or "AAVE/ETH"
 * @param props.side - Side of the order; either "buy" or "sell"
 * @param props.amount - Amount to trade (in either base or spend currency)
 * @param props.amountCurrency - Whether the amount is in base or spend currency
 * @param props.takeProfitPrice - Price for take profit orders
 * @param props.takeProfitType - Type of take profit price (absolute or percentage)
 * @param props.stopLossPrice - Price for stop loss orders
 * @param props.stopLossType - Type of stop loss price (absolute or percentage)
 * @param props.limitPrice - Price for limit orders; if not provided it will be set to the market price (Bybit requires a limit price to be always set for this kind of orders)
 * @param options
 * @returns A message confirming the order or an error description
 */
export async function createSpotEntryOrderWithTakeProfitAndOrStopLossAttached(
    { market, side, amount, amountCurrency, takeProfitPrice, takeProfitType, stopLossPrice, stopLossType, limitPrice }: Props,
    { exchange, notify }: FunctionOptionsWithExchange,
): Promise<FunctionReturn> {
    try {
        // If the limit price is not provided, simulate a market order by
        // setting it slightly above/below the market price.
        if (!limitPrice) {
            const lastPrice = await getMarketLastPriceBySymbol(market, exchange);
            let aboveOrBelow;
            if (side === 'buy') {
                limitPrice = lastPrice * (1 + LIMIT_PRICE_TOLERANCE);
                aboveOrBelow = 'above';
            } else {
                limitPrice = lastPrice * (1 - LIMIT_PRICE_TOLERANCE);
                aboveOrBelow = 'below';
            }
            notify(`No limit price provided, setting it slightly ${aboveOrBelow} the market price: ${limitPrice}`);
        }

        // Validate the market type
        const marketObject = await getMarketObject(exchange, market);
        if (marketObject.type !== 'spot') {
            throw new Error(`Market ${market} is not a spot market`);
        }

        // Convert amount to base currency if needed
        const baseAmount = await convertToBaseAmount({
            amount,
            amountCurrency,
            market,
            marketType: 'spot',
            limitPrice,
            exchange,
        });
        if (amountCurrency === 'spend') {
            notify(`${amount} ${marketObject.quote} converted to ${baseAmount} ${marketObject.base}`);
        }

        // Convert TP percentage values to absolute prices if needed
        let absoluteTakeProfitPrice: number | null = null;
        if (takeProfitPrice) {
            if (takeProfitType === null) {
                throw new Error('Could not determine whether the take profit price is an absolute or percentage value');
            }
            absoluteTakeProfitPrice = await convertTargetToAbsolutePrice({
                targetValue: takeProfitPrice,
                targetType: takeProfitType,
                type: 'takeProfit',
                side: side,
                direction: 'opposite', // trigger order opposite to the position side
                market: market,
                limitPrice: limitPrice,
                exchange: exchange,
            });
            if (takeProfitType === 'percentage') {
                notify(`${takeProfitPrice}% TP price: ${absoluteTakeProfitPrice}`);
            }
        }

        // Convert SL percentage values to absolute prices if needed
        let absoluteStopLossPrice: number | null = null;
        if (stopLossPrice) {
            if (stopLossType === null) {
                throw new Error('Could not determine whether the stop loss price is an absolute or percentage value');
            }
            absoluteStopLossPrice = await convertTargetToAbsolutePrice({
                targetValue: stopLossPrice,
                targetType: stopLossType,
                type: 'stopLoss',
                side: side,
                direction: 'opposite', // trigger order opposite to the position side
                market: market,
                limitPrice: limitPrice,
                exchange: exchange,
            });
            if (stopLossType === 'percentage') {
                notify(`${stopLossPrice}% SL price: ${absoluteStopLossPrice}`);
            }
        }

        // Create the order
        const orderId = await createSpotEntryOrderWithTakeProfitAndOrStopLossAttachedHelper(
            exchange,
            marketObject,
            side,
            baseAmount,
            limitPrice,
            absoluteTakeProfitPrice,
            absoluteStopLossPrice,
        );
        notify(`Successfully submitted order with ID ${orderId}, now getting order status...`);

        // Get the order object
        const orderObject = await getOrderById(exchange, orderId, marketObject.symbol);
        return toResult(`Successfully created entry order: ${formatOrderSingleLine(orderObject, marketObject, true)}`);
    } catch (error) {
        return toResult(`Error creating spot entry order with TP/SL attached: ${error}`, true);
    }
}

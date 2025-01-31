const Q96 = 2n ** 96n;
const MAX_TICK = 887272;
const MIN_TICK = -887272;

/**
 * Converts a price to its corresponding tick value
 * @param price The price to convert
 * @param decimals0 Decimals of token0
 * @param decimals1 Decimals of token1
 */
export function priceToTick(price: number, decimals0: number, decimals1: number): number {
    const adjustedPrice = price * Math.pow(10, decimals1 - decimals0);
    return Math.floor(Math.log(adjustedPrice) / Math.log(1.0001));
}

/**
 * Converts a tick to its corresponding price
 * @param tick The tick to convert
 * @param decimals0 Decimals of token0
 * @param decimals1 Decimals of token1
 */
export function tickToPrice(tick: number, decimals0: number, decimals1: number): number {
    const price = Math.pow(1.0001, tick);
    return price / Math.pow(10, decimals1 - decimals0);
}

/**
 * Validates and adjusts tick range to ensure it's within bounds
 * @param tickLower Lower tick
 * @param tickUpper Upper tick
 */
export function validateTickRange(tickLower: number, tickUpper: number): { tickLower: number; tickUpper: number } {
    if (tickLower >= tickUpper) {
        throw new Error('Lower tick must be less than upper tick');
    }

    if (tickLower < MIN_TICK) tickLower = MIN_TICK;
    if (tickUpper > MAX_TICK) tickUpper = MAX_TICK;

    return { tickLower, tickUpper };
}

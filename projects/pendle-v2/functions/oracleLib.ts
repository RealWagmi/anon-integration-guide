// Define the interface locally
interface AggregatorV3Interface {
    decimals(): Promise<number>;
    description(): Promise<string>;
    version(): Promise<number>;
    getRoundData(roundId: number): Promise<{
        roundId: number;
        answer: number;
        startedAt: number;
        updatedAt: number;
        answeredInRound: number;
    }>;
    latestRoundData(): Promise<{
        roundId: number;
        answer: number;
        startedAt: number;
        updatedAt: number;
        answeredInRound: number;
    }>;
    timeout(): Promise<number>;
}

export async function staleCheckLatestRoundData(
    priceFeed: AggregatorV3Interface,
    maxStalenessPeriod: number
): Promise<[number, number, number, number, number]> {
    const latestRoundData = await priceFeed.latestRoundData();
    const { roundId, answer, startedAt, updatedAt, answeredInRound } = latestRoundData;

    if (Date.now() / 1000 - updatedAt > maxStalenessPeriod) {
        throw new Error('Price data is stale');
    }

    return [roundId, answer, startedAt, updatedAt, answeredInRound];
}

export async function getTimeout(priceFeed: AggregatorV3Interface): Promise<number> {
    // Assuming the timeout is stored in a specific way in the price feed contract
    const timeout = await priceFeed.timeout();
    return timeout;
}

export async function getPriceFromChainlink(
    priceFeed: AggregatorV3Interface,
    maxStalenessPeriod: number
): Promise<number> {
    const [roundId, price, startedAt, updatedAt, answeredInRound] = await staleCheckLatestRoundData(priceFeed, maxStalenessPeriod);
    // Convert price to proper decimals if needed
    return price;
} 
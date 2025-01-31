import axios from 'axios';
import { protocolContracts } from '../constants';
import { PublicClient, Address, zeroAddress } from 'viem';
import { FactoryABI } from '../abis/FactoryABI';
import { PoolABI } from '../abis/PoolABI';
const univ3prices = require('@thanpolas/univ3prices');

export const checkPoolExists = async (tokenA: string, tokenB: string, fee: number, provider: PublicClient, chain: number) => {
    try {
        const poolAddress = await provider.readContract({
            address: protocolContracts[chain].factoryAddress as Address,
            abi: FactoryABI,
            functionName: 'getPool',
            args: [tokenA, tokenB, fee],
        });
        if (poolAddress === zeroAddress) {
            return false;
        } else {
            return true;
        }
    } catch (error) {
        console.error('Error checking pool:', error);
        return true;
    }
};
export const calculateTokenPrices = async (address1: string, address2: string) => {
    const price1 = await getRecentPrice(address1);
    const price2 = await getRecentPrice(address2);
    return [price1, price2];
};
export const getPriceAndTickFromValues = (price: number) => {
    const _tempPrice = Math.sqrt(2 ** 192 * price);
    let _tick = univ3prices.tickMath.getTickAtSqrtRatio(_tempPrice);
    _tick = _tick - (_tick % 200);
    const _price = BigInt(univ3prices.tickMath.getSqrtRatioAtTick(_tick).toString());
    return { tick: _tick, price: _price };
};
export const getPairToken = async (poolAddress: Address, provider: PublicClient, chain: number) => {
    try {
        const token0 = await provider.readContract({
            address: poolAddress,
            abi: PoolABI,
            functionName: 'token0',
            args: [],
        });
        const token1 = await provider.readContract({
            address: poolAddress,
            abi: PoolABI,
            functionName: 'token1',
            args: [],
        });
        if (token0 as Address == protocolContracts[chain].BasicTokenAddress as Address) {
            return token1;
        }
        if (token1 as Address == protocolContracts[chain].BasicTokenAddress as Address) {
            return token0;
        }
        return zeroAddress;
    } catch (error) {
        console.error('Error checking pool:', error);
        return zeroAddress;
    }
}
const getRecentPrice = async (address: string) => {
    const url = `https://api.dexscreener.com/latest/dex/tokens/${address}`;
    try {
        const response = await axios.get(url);
        const priceUsd = response.data.pairs[0].priceUsd;
        return priceUsd;
    } catch (error) {
        return 0;
    }
};

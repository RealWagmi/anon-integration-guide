import { FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { Address, formatUnits } from 'viem';
import chainlinkOracleAbi from '../abis/chainlinkOracle';
import comptrollerAbi from '../abis/comptroller';
import { CORE_COMPTROLLER_ADDRESS, ECOSYSTEM_UNITROLLER_ADDRESS, MarketProps } from '../constants';
import { parseMarket, parseWallet } from '../utils/parse';

type Props = MarketProps & {
    chainName: string;
    account: Address;
};

/**
 * Get specified market borrow limit
 * @param props - The function {@link Props}
 * @param tools - System tools for blockchain interactions
 * @returns borrow limit in specified market currency
 */
export async function getMarketBorrowLimit(props: Props, { getProvider }: FunctionOptions): Promise<FunctionReturn> {
    const wallet = parseWallet(props);

    if (!wallet.success) {
        return toResult(wallet.errorMessage, true);
    }

    const market = parseMarket(props);

    if (!market.success) {
        return toResult(market.errorMessage, true);
    }

    const { account, chainId } = wallet.data;

    const provider = getProvider(chainId);

    const oracleAddress = await provider.readContract({
        abi: comptrollerAbi,
        address: market.data.marketType === 'core' ? CORE_COMPTROLLER_ADDRESS : ECOSYSTEM_UNITROLLER_ADDRESS,
        functionName: 'oracle',
        args: [],
    });

    const [tokenPrice, liquidity] = await provider.multicall({
        contracts: [
            {
                abi: chainlinkOracleAbi,
                address: oracleAddress,
                functionName: 'getUnderlyingPrice',
                args: [market.data.marketAddress],
            },
            {
                abi: comptrollerAbi,
                address: market.data.marketType === 'core' ? CORE_COMPTROLLER_ADDRESS : ECOSYSTEM_UNITROLLER_ADDRESS,
                functionName: 'getAccountLiquidity',
                args: [account],
            },
        ],
    });

    if (tokenPrice.status !== 'success') {
        return toResult(tokenPrice.error.message, true);
    }

    if (liquidity.status !== 'success') {
        return toResult(liquidity.error.message, true);
    }

    const [error, liquidityAmount] = liquidity.result;

    if (error) {
        return toResult(`Error while fetching account liquidity: Error code ${error}`, true);
    }

    const additionalPrecision = 10n ** 18n;
    const borrowLimit = (liquidityAmount * additionalPrecision) / tokenPrice.result;

    return toResult(`Your market borrow limit for ${market.data.marketName} token: ${formatUnits(borrowLimit, 18)}`);
}

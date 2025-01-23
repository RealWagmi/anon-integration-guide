import { FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { Address, formatUnits } from 'viem';
import comptrollerAbi from '../abis/comptroller';
import { CORE_COMPTROLLER_ADDRESS, ECOSYSTEM_UNITROLLER_ADDRESS, LIQUIDITY_DECIMALS, MarketProps } from '../constants';
import { parseWallet } from '../utils';

type Props = {
    chainName: string;
    account: Address;
    marketType: MarketProps['marketType'];
};

/**
 * Get account liquidity in USD.
 * @param props - The function `Props`
 * @param tools - System tools for blockchain interactions
 * @returns liquidity and shortfall in USD
 */
export async function getAccountLiquidity(props: Props, { sendTransactions, notify, getProvider }: FunctionOptions): Promise<FunctionReturn> {
    const wallet = parseWallet(props);

    if (!wallet.success) {
        return toResult(wallet.errorMessage, true);
    }

    const { marketType } = props;

    // @ts-expect-error users shouldn't pass marketType outside of specified type
    if (marketType !== 'core' || marketType !== 'ecosystem') {
        return toResult('Incorrect market type specified', true);
    }

    const { account, chainId } = wallet.data;

    const provider = getProvider(chainId);

    const [error, liquidity, shortfall] = await provider.readContract({
        abi: comptrollerAbi,
        address: marketType === 'core' ? CORE_COMPTROLLER_ADDRESS : ECOSYSTEM_UNITROLLER_ADDRESS,
        functionName: 'getAccountLiquidity',
        args: [account],
    });

    if (error) {
        return toResult(`Error while fetching account liquidity: Error code ${error}`, true);
    }

    return toResult(`Account liquidity: ${formatUnits(liquidity, LIQUIDITY_DECIMALS)} USD, Shortfall: ${formatUnits(shortfall, LIQUIDITY_DECIMALS)} USD`);
}

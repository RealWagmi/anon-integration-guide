import { FunctionReturn, toResult, getChainFromName, FunctionOptions } from '@heyanon/sdk';
import { Address, parseUnits } from 'viem';
import { supportedChains } from '../constants';
import { LiquidityDistribution } from '@traderjoe-xyz/sdk-v2';
import { getTokenInfo } from '../utils';

interface Props {
    account: Address;
    chainName: string;
    tokenX: Address;
    tokenY: Address;
    tokenXAmount: string;
    tokenYAmount: string;
    liquidityDistribution: LiquidityDistribution;
    allowedSlippageInPercentage: string;
}

export async function addLiquidity(
    { account, chainName, tokenX, tokenXAmount, tokenYAmount, tokenY, liquidityDistribution, allowedSlippageInPercentage }: Props,
    { getProvider }: FunctionOptions,
): Promise<FunctionReturn> {
    // Check wallet connection
    if (!account) return toResult('Wallet not connected', true);

    // Validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Protocol is not supported on ${chainName}`, true);

    if (tokenX == tokenY) return toResult('`tokenX` and `tokenY` must be distinct from each other.', true);

    // Make sure that `buyTokenAddress` and `sellTokenAddress` is a valid ERC20 token
    const provider = getProvider(chainId);
    const tokenXInfo = await getTokenInfo(chainId as number, provider, tokenX);
    const tokenYInfo = await getTokenInfo(chainId as number, provider, tokenY);

    if (!tokenXInfo) return toResult('Invalid ERC20 address for `tokenX`', true);
    if (!tokenYInfo) return toResult('Invalid ERC20 address for `tokenY`', true);

    const tokenXAmountParsed = parseUnits(tokenXAmount, tokenXInfo.decimals);
    const tokenYAmountParsed = parseUnits(tokenYAmount, tokenYInfo.decimals);
    const allowedSlippageInBips = Number(allowedSlippageInPercentage) * 100;
}

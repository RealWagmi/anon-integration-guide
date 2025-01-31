import { FunctionReturn, toResult, getChainFromName, FunctionOptions } from '@heyanon/sdk';
import { Address, parseUnits } from 'viem';
import { supportedChains } from '../constants';
import { LiquidityDistribution, PairV2 } from '@traderjoe-xyz/sdk-v2';
import { getTokenInfo } from '../utils';

interface Props {
    account: Address;
    chainName: string;
    tokenX: Address;
    tokenY: Address;
    tokenXAmount: string;
    tokenYAmount: string;
    lpConfig: 'spot' | 'curve' | 'bidask';
    allowedSlippageInPercentage: string;
}

export async function addLiquidity(
    { account, chainName, tokenX, tokenXAmount, tokenYAmount, tokenY, lpConfig, allowedSlippageInPercentage }: Props,
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

    const tokenXAmountBN = parseUnits(tokenXAmount, tokenXInfo.decimals);
    const tokenYAmountBN = parseUnits(tokenYAmount, tokenYInfo.decimals);

    const oneHundredPercentInBips = parseUnits('100', 2);
    const allowedSlippageInBips = parseUnits(allowedSlippageInPercentage, 2);

    const minTokenXAmount = (tokenXAmountBN * (oneHundredPercentInBips - allowedSlippageInBips)) / oneHundredPercentInBips;
    const minTokenYAmount = (tokenYAmountBN * (oneHundredPercentInBips - allowedSlippageInBips)) / oneHundredPercentInBips;

    const pair = new PairV2(tokenXInfo, tokenYInfo);
}

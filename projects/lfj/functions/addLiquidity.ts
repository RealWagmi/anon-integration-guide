import { Address, parseUnits, encodeFunctionData } from 'viem';
import { FunctionReturn, FunctionOptions, TransactionParams, toResult, getChainFromName, checkToApprove, WETH9 } from '@heyanon/sdk';
import { supportedChains } from '../constants';
import { JSBI, LBRouterV22ABI, LB_ROUTER_V22_ADDRESS, LiquidityDistribution, PairV2, getLiquidityConfig } from '@traderjoe-xyz/sdk-v2';
import { TokenAmount } from '@traderjoe-xyz/sdk-core';

import { getTokenInfo } from '../utils';

interface Props {
    chainName: string;
    account: Address;

    binStep: number;
    tokenXAddress: Address;
    tokenXAmount: string;
    tokenYAddress: Address;
    tokenYAmount: string;
}

export async function addLiquidity(
    { chainName, account, binStep, tokenXAddress, tokenYAddress, tokenXAmount, tokenYAmount }: Props,
    { sendTransactions, notify, getProvider }: FunctionOptions,
): Promise<FunctionReturn> {
    // Check wallet connection
    if (!account) return toResult('Wallet not connected', true);

    // Validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Protocol is not supported on ${chainName}`, true);

    if (tokenXAmount == tokenXAddress) return toResult('`tokenXAddress` cannot be the same as `tokenYAddress`', true);

    // Make sure that `buyTokenAddress` and `sellTokenAddress` is a valid ERC20 token
    const provider = getProvider(chainId);
    const tokenX = await getTokenInfo(chainId as number, provider, tokenXAddress);
    const tokenY = await getTokenInfo(chainId as number, provider, tokenYAddress);

    if (!tokenX) return toResult('Invalid ERC20 address for `tokenX`', true);
    if (!tokenY) return toResult('Invalid ERC20 address for `tokenY`', true);

    const tokenXParsed = parseUnits(tokenXAmount, tokenX.decimals);
    const tokenYParsed = parseUnits(tokenYAmount, tokenY.decimals);

    const tokenXAmount_ = new TokenAmount(tokenX, tokenXParsed);
    const tokenYAmount_ = new TokenAmount(tokenY, tokenYParsed);

    const allowedAmountsSlippage = 50;

    const minTokenAmountX = JSBI.divide(JSBI.multiply(tokenYAmount_.raw, JSBI.BigInt(1000 - allowedAmountsSlippage)), JSBI.BigInt(10000));
    const minTokenAmountY = JSBI.divide(JSBI.multiply(tokenYAmount_.raw, JSBI.BigInt(1000 - allowedAmountsSlippage)), JSBI.BigInt(10000));

    const pair = new PairV2(tokenX, tokenY);
    const pairVersion = 'v22';
    const lbPair = await pair.fetchLBPair(binStep, pairVersion, provider, chainId as number);

    if (lbPair.LBPair == '0x0000000000000000000000000000000000000000') {
        return toResult('No LB pair found with given parameters');
    }

    const lbPairData = await PairV2.getLBPairReservesAndId(lbPair.LBPair, pairVersion, provider);
    const activeBinId = lbPairData.activeId;

    const { deltaIds, distributionX, distributionY } = getLiquidityConfig(LiquidityDistribution.SPOT);
    const currentTimeInSec = Math.floor(new Date().getTime() / 1000);

    const addLiquidityInput = {
        tokenX: tokenX.address,
        tokenY: tokenY.address,
        binStep: binStep,
        amountX: tokenXAmount_.raw.toString(),
        amountY: tokenYAmount_.raw.toString(),
        amountXMin: minTokenAmountX.toString(),
        amountYMin: minTokenAmountY.toString(),
        activeIdDesired: activeBinId,
        idSlippage: BigInt(5),
        deltaIds,
        distributionX,
        distributionY,
        to: account,
        refundTo: account,
        deadline: currentTimeInSec + 3600,
    };

    const tx: TransactionParams = {
        target: LB_ROUTER_V22_ADDRESS[chainId],
        data: encodeFunctionData({
            abi: LBRouterV22ABI,
            methodName: 'addLiquidity',
            // @ts-ignore
            args: [addLiquidityInput],
        }),
    };

    const result = await sendTransactions({ chainId, account, transactions: [tx] });
    const swapMessage = result.data[result.data.length - 1];

    return toResult(result.isMultisig ? swapMessage.message : 'Successfully added liquidity.');
}

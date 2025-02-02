import { FunctionReturn, toResult, getChainFromName, FunctionOptions, checkToApprove, TransactionParams } from '@heyanon/sdk';
import { Address, parseUnits, encodeFunctionData } from 'viem';
import { liquidityDistribution, supportedChains } from '../constants';
import { LBRouterV22ABI, LB_ROUTER_V22_ADDRESS, PairV2, getLiquidityConfig } from '@traderjoe-xyz/sdk-v2';
import { getTokenInfo } from '../utils';

interface Props {
    account: Address;
    chainName: string;
    tokenX: Address;
    tokenY: Address;
    tokenXAmount: string;
    tokenYAmount: string;
    distribution: 'spot' | 'curve' | 'bidask';
    binStep: number;
    allowedSlippageInPercentage: string;
}

export async function addLiquidity(
    { account, chainName, tokenX, tokenXAmount, tokenYAmount, tokenY, distribution, allowedSlippageInPercentage, binStep }: Props,
    { getProvider, sendTransactions, notify }: FunctionOptions,
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

    const minTokenXAmountBN = (tokenXAmountBN * (oneHundredPercentInBips - allowedSlippageInBips)) / oneHundredPercentInBips;
    const minTokenYAmountBN = (tokenYAmountBN * (oneHundredPercentInBips - allowedSlippageInBips)) / oneHundredPercentInBips;

    const approvals: TransactionParams[] = [];

    await checkToApprove({
        args: {
            account,
            target: tokenX,
            spender: LB_ROUTER_V22_ADDRESS[chainId],
            amount: tokenXAmountBN,
        },
        transactions: approvals,
        provider,
    });

    await checkToApprove({
        args: {
            account,
            target: tokenY,
            spender: LB_ROUTER_V22_ADDRESS[chainId],
            amount: tokenYAmountBN,
        },
        transactions: approvals,
        provider,
    });

    await notify(`Approving  ${tokenXInfo.symbol} and ${tokenYInfo.symbol} ...`);

    await sendTransactions({
        chainId,
        account,
        transactions: approvals,
    });

    const pair = new PairV2(tokenXInfo, tokenYInfo);
    const pairVersion = 'v22';

    const lbPair = await pair.fetchLBPair(binStep, pairVersion, provider, chainId as number);

    if (lbPair.LBPair == '0x0000000000000000000000000000000000000000') {
        return toResult('No LB pair found with given parameters');
    }

    const lbPairData = await PairV2.getLBPairReservesAndId(lbPair.LBPair, pairVersion, provider);
    const activeBinId = lbPairData.activeId;

    const config = liquidityDistribution[distribution];
    const { deltaIds, distributionX, distributionY } = getLiquidityConfig(config);

    const currentTimeInSec = Math.floor(new Date().getTime() / 1000);
    const addLiquidityInput = {
        tokenX,
        tokenY,
        binStep,
        amountX: tokenXAmountBN,
        amountY: tokenYAmountBN,
        amountXMin: minTokenXAmountBN,
        amountYMin: minTokenYAmountBN,
        activeIdDesired: activeBinId,
        idSlippage: 5,
        deltaIds,
        distributionX,
        distributionY,
        to: account,
        refundTo: account,
        deadline: currentTimeInSec + 3600,
    };

    await notify('Adding liquidity ...');

    const tx: TransactionParams = {
        target: LB_ROUTER_V22_ADDRESS[chainId],
        data: encodeFunctionData({
            abi: LBRouterV22ABI,
            functionName: 'addLiquidity',
            // @ts-ignore
            args: [addLiquidityInput],
        }),
    };

    await sendTransactions({
        chainId,
        account,
        transactions: [tx],
    });

    return toResult('Successfully added liquidity.');
}

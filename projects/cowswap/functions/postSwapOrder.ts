import { Address, parseUnits, encodeFunctionData } from 'viem';
import { FunctionReturn, FunctionOptions, toResult, checkToApprove, getChainFromName, TransactionParams } from '@heyanon/sdk';
import { supportedChains } from '../constants';
import { VoidSigner } from '@ethersproject/abstract-signer';

import { cowswapSettlementAbi } from '../abis/cowswap_settlement_abi';
import {
    COW_PROTOCOL_VAULT_RELAYER_ADDRESS,
    COW_PROTOCOL_SETTLEMENT_CONTRACT_ADDRESS,
    TradingSdk,
    TradeParameters,
    OrderKind,
    SwapAdvancedSettings,
    SigningScheme,
} from '@cowprotocol/cow-sdk';

import { getTokenInfo, slippageToleranceToBips } from '../utils';

interface Props {
    chainName: string;
    account: Address;
    amount: string;
    receiver: Address | null;
    slippageTolerance: string | null;

    inputToken: Address;
    outputToken: Address;
}

export async function postSwapOrder(
    { chainName, account, amount, inputToken, outputToken, receiver = account, slippageTolerance }: Props,
    { notify, getProvider, sendTransactions }: FunctionOptions,
): Promise<FunctionReturn> {
    // Check wallet connection
    if (!account) return toResult('Wallet not connected', true);
    if (!slippageTolerance) slippageTolerance = '0.5';

    // Validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Protocol is not supported on ${chainName}`, true);
    if (outputToken == inputToken) return toResult('outputToken and inputToken must be distinct from each other', true);

    const provider = getProvider(chainId);

    const inputTokenInfo = await getTokenInfo(inputToken, provider);
    if (!inputTokenInfo) return toResult('Invalid ERC20 for inputToken', true);

    const outputTokenInfo = await getTokenInfo(outputToken, provider);
    if (!outputTokenInfo) return toResult('Invalid ERC20 for inputToken', true);

    // Validate amount
    if (Number(amount) <= 0) return toResult('amount must be greater than 0', true);

    await notify('Preparing swap order...');

    const amountParsed = parseUnits(amount, inputTokenInfo.decimals);

    const approval: TransactionParams[] = [];

    // Approve inputToken
    await checkToApprove({
        args: {
            account,
            target: inputToken,
            amount: amountParsed,
            spender: COW_PROTOCOL_VAULT_RELAYER_ADDRESS[chainId] as '0x{string}',
        },
        transactions: approval,
        provider,
    });

    await notify(`Approving ${amount} of ${inputTokenInfo.symbol}`);

    await sendTransactions({
        chainId,
        account,
        transactions: approval,
    });

    await notify(`Swapping ${amount} ${inputTokenInfo.symbol} to ${outputTokenInfo.symbol}`);

    const sdk = new TradingSdk({
        chainId: chainId as number,
        // the signer isn't actually used because we're using presign to support multisig.
        signer: new VoidSigner(account),
        appCode: 'HeyAnon',
    });

    const slippageToleranceToBipsResult = slippageToleranceToBips(slippageTolerance);
    if (!slippageToleranceToBipsResult.success) {
        return toResult(slippageToleranceToBipsResult.message, true);
    }

    const parameters: TradeParameters = {
        kind: OrderKind.SELL,
        sellToken: inputToken,
        sellTokenDecimals: inputTokenInfo.decimals,
        buyToken: outputToken,
        buyTokenDecimals: outputTokenInfo.decimals,
        amount: amountParsed.toString(),
        receiver,
        slippageBps: slippageToleranceToBipsResult.result,
    };

    const settings: SwapAdvancedSettings = {
        quoteRequest: {
            signingScheme: SigningScheme.PRESIGN,
        },
    };

    const orderUid = await sdk.postSwapOrder(parameters, settings);
    const tx: TransactionParams = {
        target: COW_PROTOCOL_SETTLEMENT_CONTRACT_ADDRESS[chainId] as `0x{string}`,
        data: encodeFunctionData({
            abi: cowswapSettlementAbi,
            functionName: 'setPreSignature',
            args: [orderUid, true],
        }),
    };

    await sendTransactions({
        chainId,
        account,
        transactions: [tx],
    });

    return toResult(
        `
Successfully processed order to swap ${amount} ${inputTokenInfo.symbol} to ${outputTokenInfo.symbol}
orderUid: ${orderUid}`,
    );
}

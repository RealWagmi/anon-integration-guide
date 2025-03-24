import { Address, parseUnits, formatUnits, encodeFunctionData, encodeAbiParameters } from 'viem';
import { FunctionReturn, FunctionOptions, TransactionParams, toResult, getChainFromName, checkToApprove } from '@heyanon/sdk';
import { supportedChains, WS_ADDRESS, ROUTER_ADDRESS, BORROWABLE_WS_DEPOSIT_ADDRESS } from '../constants';
import { routerAbi, wsAbi } from '../abis';

interface Props {
    chainName: string;
    account: Address;
    amount: string;
}

export async function repayWS({ chainName, account, amount }: Props, { sendTransactions, getProvider, notify }: FunctionOptions): Promise<FunctionReturn> {
    if (!account) return toResult('Wallet not connected', true);

    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Sky protocol is not supported on ${chainName}`, true);

    await notify('Preparing to repay wS tokens to Silo...');

    const amountInWei = parseUnits(amount, 18);
    if (amountInWei === 0n) return toResult('Amount must be greater than 0', true);

    const provider = getProvider(chainId);
    const wSBalance = (await provider.readContract({ abi: wsAbi, address: WS_ADDRESS, functionName: 'balanceOf', args: [account] })) as bigint;

    if (wSBalance < amountInWei) {
        return toResult(`Insufficient wS balance. Have ${formatUnits(wSBalance, 18)}, want to repay ${amount}`, true);
    }

    const transactions: TransactionParams[] = [];

    // Check and prepare approve transaction if needed
    await checkToApprove({
        args: {
            account,
            target: WS_ADDRESS,
            spender: ROUTER_ADDRESS,
            amount: amountInWei,
        },
        provider,
        transactions,
    });

    const collateralType = 1; // means Silo can use the stS as collateral
    const options = encodeAbiParameters(
        [
            { name: 'amount', type: 'uint256' },
            { name: 'ISilo.CollateralType', type: 'uint8' },
        ],
        [amountInWei, collateralType],
    );

    const repayActionType = 2;

    // Prepare deposit transaction
    const tx: TransactionParams = {
        target: ROUTER_ADDRESS,
        data: encodeFunctionData({
            abi: routerAbi,
            functionName: 'execute',
            args: [[repayActionType, BORROWABLE_WS_DEPOSIT_ADDRESS, WS_ADDRESS, options]],
        }),
    };
    transactions.push(tx);

    await notify('Waiting for transaction confirmation...');

    const result = await sendTransactions({ chainId, account, transactions });
    const redeemMessage = result.data[result.data.length - 1];

    return toResult(result.isMultisig ? redeemMessage.message : `Successfully repay ${amount} wS. ${redeemMessage.message}`);
}

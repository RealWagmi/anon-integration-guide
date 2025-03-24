import { Address, encodeFunctionData, encodeAbiParameters, parseUnits, formatUnits } from 'viem';
import { FunctionReturn, FunctionOptions, TransactionParams, toResult, getChainFromName, checkToApprove } from '@heyanon/sdk';
import { supportedChains, STS_ADDRESS, ROUTER_ADDRESS, BORROWABLE_STS_DEPOSIT_ADDRESS } from '../constants';
import { routerAbi, stsAbi } from '../abis';

interface Props {
    chainName: string;
    account: Address;
    amount: string;
}

/**
 * Deposit stS tokens to Silo Finance
 * @param {Props} props - The properties to deposit stS tokens
 * @param {FunctionOptions} context - The function options
 * @returns Transaction result
 */
export async function depositSTS({ chainName, account, amount }: Props, { sendTransactions, notify, getProvider }: FunctionOptions): Promise<FunctionReturn> {
    if (!account) return toResult('Wallet not connected', true);

    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Silo protocol is not supported on ${chainName}`, true);

    await notify('Preparing to deposit stS tokens to Silo Finance...');

    const amountInWei = parseUnits(amount, 18);
    if (amountInWei === 0n) return toResult('Amount must be greater than 0', true);

    const provider = getProvider(chainId);
    const stSBalance = (await provider.readContract({ abi: stsAbi, address: STS_ADDRESS, functionName: 'balanceOf', args: [account] })) as bigint;

    if (stSBalance < amountInWei) {
        return toResult(`Insufficient stS balance. Have ${formatUnits(stSBalance, 18)}, want to deposit ${amount}`, true);
    }

    const transactions: TransactionParams[] = [];

    // Check and prepare approve transaction if needed
    await checkToApprove({
        args: {
            account,
            target: STS_ADDRESS,
            spender: ROUTER_ADDRESS,
            amount: amountInWei,
        },
        provider,
        transactions,
    });

    // See https://github.com/silo-finance/silo-contracts-v2/blob/0.20.0/silo-core/contracts/interfaces/ISilo.sol#L47
    const collateralType = 1; // means Silo can use the stS as collateral
    const options = encodeAbiParameters(
        [
            { name: 'amount', type: 'uint256' },
            { name: 'ISilo.CollateralType', type: 'uint8' },
        ],
        [amountInWei, collateralType],
    );

    // See https://github.com/silo-finance/silo-contracts-v2/blob/0.20.0/silo-core/contracts/SiloRouter.sol#L21
    const depositActionType = 0;

    // Prepare deposit transaction
    const tx: TransactionParams = {
        target: ROUTER_ADDRESS,
        data: encodeFunctionData({
            abi: routerAbi,
            functionName: 'execute',
            args: [[depositActionType, BORROWABLE_STS_DEPOSIT_ADDRESS, STS_ADDRESS, options]],
        }),
    };
    transactions.push(tx);

    await notify('Waiting for transaction confirmation...');

    const result = await sendTransactions({ chainId, account, transactions });
    const depositMessage = result.data[result.data.length - 1];

    return toResult(result.isMultisig ? depositMessage.message : `Successfully deposited ${amount} stS to Silo Finance. ${depositMessage.message}`);
}

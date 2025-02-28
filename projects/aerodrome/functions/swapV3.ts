import { FunctionOptions, FunctionReturn, toResult, TransactionParams } from '@heyanon/sdk';
import { Address, encodeFunctionData, erc20Abi, Hex } from 'viem';
import universalRouter from "../abis/universalRouter";
import { CommandCode, FeeAmount, MIXED_QUOTER_ADDRESS, UNIVERSAL_ROUTER_ADDRESS, V3SwapExactIn } from "../constants";
import { parseAmount, parseTokensAndFees, parseWallet } from "../utils/parse";
import { encodeV3SwapExactIn } from "../utils/encode";
import { encodePath } from "../utils/path";
import mixedQuoter from "../abis/mixedQuoter";

type Props = {
    chainName: string;
    account: Address;
    /**
     * @description Input amount for swap.
     */
    amountIn: string;
    /**
     * @description Minimum amount accepted as output of swap.
     */
    amountOutMin?: string;
    /**
     * @description List of tokens between which you want to swap. There should be at least 2.
     * Between each consecutive tokens there should be a pool.
     */
    tokens: Address[];
    /**
     * @description List of fees between each consecutive tokens. The fees are ordered and apply
     * to each consecutive token pair fee. `fees[0]` would apply to a pair of `tokens[0]` and `tokens[1]`
     */
    fees: FeeAmount[];
};

/**
 * Executes encoded commands along with provided inputs.
 * @param props - The function {@link Props}
 * @param tools - System tools for blockchain interactions
 * @returns Transaction result
 */
export async function swapV3(props: Props, { sendTransactions, notify, getProvider }: FunctionOptions): Promise<FunctionReturn> {
    // get wallet
    const wallet = parseWallet(props);
    if (!wallet.success) {
        return toResult(wallet.errorMessage, true);
    }
    const { account, chainId } = wallet.data;

    // get tokens and fees
    const tokensAndFees = parseTokensAndFees(props);
    if (!tokensAndFees.success) {
        return toResult(tokensAndFees.errorMessage, true);
    }
    const { tokens, fees } = tokensAndFees.data;

    // get path
    let path: Hex;
    try {
        path = encodePath(tokens, fees);
    } catch (error) {
        return toResult(`Unable to encode path: ${error?.message}`, true);
    }

    // get erc20 decimals
    const provider = getProvider(chainId);
    const [tokenInDecimals, tokenOutDecimals] = await provider.multicall({
        contracts: [
            {
                abi: erc20Abi,
                address: tokens[0],
                functionName: 'decimals',
            },
            {
                abi: erc20Abi,
                address: tokens[tokens.length - 1],
                functionName: 'decimals',
            },
        ],
    });
    if (tokenInDecimals.status !== 'success') return toResult(tokenInDecimals.error.message, true);
    if (tokenOutDecimals.status !== 'success') return toResult(tokenOutDecimals.error.message, true);

    // parse amount in
    const amountIn = parseAmount({
        amount: props.amountIn,
        decimals: tokenInDecimals.result,
    });
    if (!amountIn.success) return toResult(amountIn.errorMessage, true);

    // parse amount out min
    let amountOutMin: bigint;
    if (!props.amountOutMin) {
        const _amountOutMin = await provider.simulateContract({
            abi: mixedQuoter,
            address: MIXED_QUOTER_ADDRESS,
            functionName: 'quoteExactInput',
            args: [path, amountIn.data],
        });
        amountOutMin = _amountOutMin[0];
    } else {
        const _amountOutMin = parseAmount({
            amount: props.amountOutMin,
            decimals: tokenOutDecimals.result,
        });
        if (!_amountOutMin.success) return toResult(_amountOutMin.errorMessage, true);
        amountOutMin = _amountOutMin.data;
    }

    // build swap
    let swap: V3SwapExactIn = {
        commandCode: CommandCode.V3_SWAP_EXACT_IN,
        recipient: props.account,
        amountIn: amountIn.data,
        amountOutMin,
        path,
        payerIsUser: true,
    }

    // build command and input bytecode
    let commandBytecode: Hex = `0x${swap.commandCode}`;
    let encodedInputs: Hex[] = [encodeV3SwapExactIn(swap)];

    // prepare tx
    await notify('Preparing execute transaction...');
    const tx: TransactionParams = {
        target: UNIVERSAL_ROUTER_ADDRESS,
        data: encodeFunctionData({
            abi: universalRouter,
            functionName: 'execute',
            args: [commandBytecode, encodedInputs],
        }),
    };

    // sign and send transaction
    await notify('Waiting for transaction confirmation...');
    const result = await sendTransactions({ chainId, account, transactions: [tx] });
    const message = result.data[result.data.length - 1];

    // return
    return toResult(result.isMultisig ? message.message : `Successfully executed swap using Aerodrome V3 through Universal Router. ${message.message}`);
}

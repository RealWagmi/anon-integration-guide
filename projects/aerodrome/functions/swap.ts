import { FunctionOptions, FunctionReturn, toResult, TransactionParams } from '@heyanon/sdk';
import { Address, encodeFunctionData, Hex } from 'viem';
import universalRouter from "../abis/universalRouter";
import { UNIVERSAL_ROUTER_ADDRESS, V3SwapExactIn } from "../constants";
import { parseSwap, parseWallet } from "../utils/parse";
import { encodeV3SwapExactIn } from "../utils/encode";

type Props = {
    chainName: string;
    account: Address;
    /**
     * @description List of commands with their inputs piped to universal router for processing.
     * Example: When performing swap through UI command bytecode is 0x0b0008.
     *          Which results in performing combination of WrapEth, V3SwapExactIn and V2SwapExactIn.
     * Source: https://github.com/velodrome-finance/universal-router/blob/3dacc720c6c243e5c472c323e92ab3866f9160fe/contracts/libraries/Commands.sol#L6
     */
    swap: V3SwapExactIn,
};

/**
 * Executes encoded commands along with provided inputs.
 * @param props - The function {@link Props}
 * @param tools - System tools for blockchain interactions
 * @returns Transaction result
 */
export async function swap(props: Props, { sendTransactions, notify }: FunctionOptions): Promise<FunctionReturn> {
    const wallet = parseWallet(props);

    if (!wallet.success) {
        return toResult(wallet.errorMessage, true);
    }

    const swapWithInput = parseSwap(props);
    if (!swapWithInput.success) {
        return toResult(swapWithInput.errorMessage, true);
    }
    const { swap } = swapWithInput.data;

    // build command and input bytecode
    let commandBytecode: Hex = '0x' + swap.commandCode;
    let encodedInputs: Hex[] = [encodeV3SwapExactIn(swap)];

    // prepare tx
    const { account, chainId } = wallet.data;
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
    return toResult(result.isMultisig ? message.message : `Successfully executed swap through Universal Router. ${message.message}`);
}

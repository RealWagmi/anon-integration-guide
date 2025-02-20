import { FunctionOptions, FunctionReturn, toResult, TransactionParams } from '@heyanon/sdk';
import { Address, encodeFunctionData, Hex } from 'viem';
import universalRouter from "../abis/universalRouter";
import { CommandCode, CommandList, UNIVERSAL_ROUTER_ADDRESS } from "../constants";
import { parseCommandList, parseWallet } from "../utils/parse";
import {
    encodeApproveErc20,
    encodeBalanceCheckErc20,
    encodeOwnerCheck1155,
    encodeOwnerCheck721,
    encodePayPortion,
    encodePermit2Permit,
    encodePermit2PermitBatch,
    encodePermit2TransferFrom,
    encodePermit2TransferFromBatch,
    encodeSweep,
    encodeSweepErc1155,
    encodeSweepErc721,
    encodeTransfer,
    encodeUnwrapWeth,
    encodeV2SwapExactIn,
    encodeV2SwapExactOut,
    encodeV3SwapExactIn,
    encodeV3SwapExactOut,
    encodeWrapEth
} from "../utils/encode";

type Props = {
    chainName: string;
    account: Address;
    /**
     * @description List of commands with their inputs piped to universal router for processing.
     * Example: When performing swap through UI command bytecode is 0x0b0008.
     *          Which results in performing combination of WrapEth, V3SwapExactIn and V2SwapExactIn.
     * Source: https://github.com/velodrome-finance/universal-router/blob/3dacc720c6c243e5c472c323e92ab3866f9160fe/contracts/libraries/Commands.sol#L6
     */
    commandList: CommandList,
};

/**
 * Executes encoded commands along with provided inputs.
 * @param props - The function {@link Props}
 * @param tools - System tools for blockchain interactions
 * @returns Transaction result
 */
export async function execute(props: Props, { sendTransactions, notify }: FunctionOptions): Promise<FunctionReturn> {
    const wallet = parseWallet(props);

    if (!wallet.success) {
        return toResult(wallet.errorMessage, true);
    }

    const commandsWithInput = parseCommandList(props);
    if (!commandsWithInput.success) {
        return toResult(commandsWithInput.errorMessage, true);
    }
    const { commandList } = commandsWithInput.data;

    // build command and input bytecode
    let commandBytecode: Hex = '0x';
    let encodedInputs: Hex[];
    for (const commandWithInput of commandList.commands) {
        // build command bytecode from command codes
        commandBytecode += commandWithInput.commandCode;
        // store encoded inputs for commands
        const mapping: Record<
            (typeof commandWithInput)["commandCode"],
            (inputs: typeof commandWithInput) => Hex
        > = {
            [CommandCode.V3_SWAP_EXACT_IN]: encodeV3SwapExactIn,
            [CommandCode.V3_SWAP_EXACT_OUT]: encodeV3SwapExactOut,
            [CommandCode.PERMIT2_TRANSFER_FROM]: encodePermit2TransferFrom,
            [CommandCode.PERMIT2_PERMIT_BATCH]: encodePermit2PermitBatch,
            [CommandCode.SWEEP]: encodeSweep,
            [CommandCode.TRANSFER]: encodeTransfer,
            [CommandCode.PAY_PORTION]: encodePayPortion,
            [CommandCode.V2_SWAP_EXACT_IN]: encodeV2SwapExactIn,
            [CommandCode.V2_SWAP_EXACT_OUT]: encodeV2SwapExactOut,
            [CommandCode.PERMIT2_PERMIT]: encodePermit2Permit,
            [CommandCode.WRAP_ETH]: encodeWrapEth,
            [CommandCode.UNWRAP_WETH]: encodeUnwrapWeth,
            [CommandCode.PERMIT2_TRANSFER_FROM_BATCH]: encodePermit2TransferFromBatch,
            [CommandCode.BALANCE_CHECK_ERC20]: encodeBalanceCheckErc20,
            [CommandCode.OWNER_CHECK_721]: encodeOwnerCheck721,
            [CommandCode.OWNER_CHECK_1155]: encodeOwnerCheck1155,
            [CommandCode.SWEEP_ERC721]: encodeSweepErc721,
            [CommandCode.SWEEP_ERC1155]: encodeSweepErc1155,
            [CommandCode.APPROVE_ERC20]: encodeApproveErc20,
        };
        encodedInputs.push(mapping[commandWithInput.commandCode](commandWithInput));
    }

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
    return toResult(result.isMultisig ? message.message : `Successfully executed commands ${commandBytecode} through Universal Router. ${message.message}`);
}

import {
    ApproveErc20,
    BalanceCheckErc20,
    OwnerCheck1155,
    OwnerCheck721,
    PayPortion,
    Permit2Permit,
    Permit2PermitBatch,
    Permit2TransferFrom,
    Permit2TransferFromBatch,
    Sweep,
    SweepErc1155,
    SweepErc721,
    Transfer,
    UnwrapWeth,
    V2SwapExactIn,
    V2SwapExactOut,
    V3SwapExactIn,
    V3SwapExactOut,
    WrapEth
} from "../constants";
import { Hex, encodeAbiParameters, parseAbiParameters } from "viem";

export const encodeV3SwapExactIn = (inputs: V3SwapExactIn): Hex => {
    // encode
    let encoded = encodeAbiParameters(
        parseAbiParameters('address recipient, uint256 amountIn, uint256 amountOutMin, bytes path, bool payerIsUser'),
        [
            inputs.recipient,
            inputs.amountIn,
            inputs.amountOutMin,
            inputs.path,
            inputs.payerIsUser
        ]
    );

    // return
    return encoded as Hex;
}

export const encodeV3SwapExactOut = (inputs: V3SwapExactOut): Hex => {
    // parse amount out
    // const amountOut = parseAmount({
    //     amount: inputs.amountOut,
    //     decimals: decimals.tokenOutDecimals,
    // });
    // if (!amountOut.success) return {
    //     success: false,
    //     errorMessage: amountOut.errorMessage,
    // };
    //
    // // parse amount in max
    // const amountInMax = parseAmount({
    //     amount: inputs.amountInMax,
    //     decimals: decimals.tokenOutDecimals,
    // });
    // if (!amountInMax.success) return {
    //     success: false,
    //     errorMessage: amountInMax.errorMessage,
    // };

    // encode
    let encoded = encodeAbiParameters(
        parseAbiParameters('address recipient, uint256 amountOut, uint256 amountInMax, bytes path, bool payerIsUser'),
        [
            inputs.recipient,
            inputs.amountOut,
            inputs.amountInMax,
            inputs.path,
            inputs.payerIsUser
        ]
    );

    // return
    return encoded as Hex;
}

export const encodePermit2TransferFrom = (inputs: Permit2TransferFrom): Hex => {
    // encode
    let encoded = encodeAbiParameters(
        parseAbiParameters('address token, address recipient, uint160 amount'),
        [
            inputs.token,
            inputs.recipient,
            inputs.amount
        ]
    );

    // return
    return encoded as Hex;
}

export const encodePermit2PermitBatch = (inputs: Permit2PermitBatch): Hex => {
    // encode
    let encoded = encodeAbiParameters(
        parseAbiParameters(
            '((address token, uint160 amount, uint48 expiration, uint48 nonce)[], address spender, uint256 sigDeadline), bytes signature'
        ),
        [
            inputs.batch,
            inputs.signature,
        ]
    );

    // return
    return encoded as Hex;
}

export const encodeSweep = (inputs: Sweep): Hex => {
    // encode
    let encoded = encodeAbiParameters(
        parseAbiParameters(
            'address token, address recipient, uint256 amountMin'
        ),
        [
            inputs.token,
            inputs.recipient,
            inputs.amountMin
        ]
    );

    // return
    return encoded as Hex;
}

export const encodeTransfer = (inputs: Transfer): Hex => {
    // encode
    let encoded = encodeAbiParameters(
        parseAbiParameters(
            'address token, address recipient, uint256 value'
        ),
        [
            inputs.token,
            inputs.recipient,
            inputs.value
        ]
    );

    // return
    return encoded as Hex;
}

export const encodePayPortion = (inputs: PayPortion): Hex => {
    // encode
    let encoded = encodeAbiParameters(
        parseAbiParameters(
            'address token, address recipient, uint256 bips'
        ),
        [
            inputs.token,
            inputs.recipient,
            inputs.bips
        ]
    );

    // return
    return encoded as Hex;
}

export const encodeV2SwapExactIn = (inputs: V2SwapExactIn): Hex => {
    // encode
    let encoded = encodeAbiParameters(
        parseAbiParameters(
            'address recipient, uint256 amountIn, uint256 amountOutMin, (address from, address to, bool stable)[], bool payerIsUser'
        ),
        [
            inputs.recipient,
            inputs.amountIn,
            inputs.amountOutMin,
            inputs.routes,
            inputs.payerIsUser
        ]
    );

    // return
    return encoded as Hex;
}

export const encodeV2SwapExactOut = (inputs: V2SwapExactOut): Hex => {
    // encode
    let encoded = encodeAbiParameters(
        parseAbiParameters(
            'address recipient, uint256 amountOut, uint256 amountInMax, (address from, address to, bool stable)[], bool payerIsUser'
        ),
        [
            inputs.recipient,
            inputs.amountOut,
            inputs.amountInMax,
            inputs.routes,
            inputs.payerIsUser
        ]
    );

    // return
    return encoded as Hex;
}

export const encodePermit2Permit = (inputs: Permit2Permit): Hex => {
    // encode
    let encoded = encodeAbiParameters(
        parseAbiParameters(
            '((address token, uint160 amount, uint48 expiration, uint48 nonce), address spender, uint256 sigDeadline), bytes signature'
        ),
        [
            inputs.single,
            inputs.signature,
        ]
    );

    // return
    return encoded as Hex;
}

export const encodeWrapEth = (inputs: WrapEth): Hex => {
    // encode
    let encoded = encodeAbiParameters(
        parseAbiParameters(
            'address recipient, uint256 amountMin'
        ),
        [
            inputs.recipient,
            inputs.amountMin,
        ]
    );

    // return
    return encoded as Hex;
}

export const encodeUnwrapWeth = (inputs: UnwrapWeth): Hex => {
    // encode
    let encoded = encodeAbiParameters(
        parseAbiParameters(
            'address recipient, uint256 amountMin'
        ),
        [
            inputs.recipient,
            inputs.amountMin,
        ]
    );

    // return
    return encoded as Hex;
}

export const encodePermit2TransferFromBatch = (inputs: Permit2TransferFromBatch): Hex => {
    // encode
    let encoded = encodeAbiParameters(
        parseAbiParameters(
            '(address from, address to, uint256 amount, address token)[]'
        ),
        [
            inputs.transfers,
        ]
    );

    // return
    return encoded as Hex;
}

export const encodeBalanceCheckErc20 = (inputs: BalanceCheckErc20): Hex => {
    // encode
    let encoded = encodeAbiParameters(
        parseAbiParameters(
            'address owner, address token, uint256 minBalance'
        ),
        [
            inputs.owner,
            inputs.token,
            inputs.minBalance,
        ]
    );

    // return
    return encoded as Hex;
}

export const encodeOwnerCheck721 = (inputs: OwnerCheck721): Hex => {
    // encode
    let encoded = encodeAbiParameters(
        parseAbiParameters(
            'address owner, address token, uint256 id'
        ),
        [
            inputs.owner,
            inputs.token,
            inputs.id,
        ]
    );

    // return
    return encoded as Hex;
}

export const encodeOwnerCheck1155 = (inputs: OwnerCheck1155): Hex => {
    // encode
    let encoded = encodeAbiParameters(
        parseAbiParameters(
            'address owner, address token, uint256 id, uint256 minBalance'
        ),
        [
            inputs.owner,
            inputs.token,
            inputs.id,
            inputs.minBalance,
        ]
    );

    // return
    return encoded as Hex;
}

export const encodeSweepErc721 = (inputs: SweepErc721): Hex => {
    // encode
    let encoded = encodeAbiParameters(
        parseAbiParameters(
            'address token, address recipient, uint256 id'
        ),
        [
            inputs.token,
            inputs.recipient,
            inputs.id,
        ]
    );

    // return
    return encoded as Hex;
}

export const encodeSweepErc1155 = (inputs: SweepErc1155): Hex => {
    // encode
    let encoded = encodeAbiParameters(
        parseAbiParameters(
            'address token, address recipient, uint256 id, uint256 amount'
        ),
        [
            inputs.token,
            inputs.recipient,
            inputs.id,
            inputs.amount,
        ]
    );

    // return
    return encoded as Hex;
}

export const encodeApproveErc20 = (inputs: ApproveErc20): Hex => {
    // encode
    let encoded = encodeAbiParameters(
        parseAbiParameters(
            'address token, address spender'
        ),
        [
            inputs.token,
            inputs.spender,
        ]
    );

    // return
    return encoded as Hex;
}

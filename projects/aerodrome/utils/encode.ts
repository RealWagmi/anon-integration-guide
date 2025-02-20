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
import { Hex } from "viem";

export const encodeV3SwapExactIn = (inputs: V3SwapExactIn): Hex => {
    let encoded = "0x";
    encoded += inputs.recipient;
    encoded += inputs.amountIn;
    encoded += inputs.amountOutMin;
    encoded += inputs.path;
    encoded += inputs.payerIsUser;
    return encoded as Hex;
}

export const encodeV3SwapExactOut = (inputs: V3SwapExactOut): Hex => {
    let encoded = "0x";
    encoded += inputs.recipient;
    encoded += inputs.amountOut;
    encoded += inputs.amountInMax;
    encoded += inputs.path;
    encoded += inputs.payerIsUser;
    return encoded as Hex;
}

export const encodePermit2TransferFrom = (inputs: Permit2TransferFrom): Hex => {
    let encoded = "0x";
    encoded += inputs.token;
    encoded += inputs.recipient;
    encoded += inputs.amount;
    return encoded as Hex;
}

export const encodePermit2PermitBatch = (inputs: Permit2PermitBatch): Hex => {
    let encoded = "0x";
    encoded += inputs.permits;
    encoded += inputs.spender;
    encoded += inputs.sigDeadline;
    return encoded as Hex;
}

export const encodeSweep = (inputs: Sweep): Hex => {
    let encoded = "0x";
    encoded += inputs.token;
    encoded += inputs.recipient;
    encoded += inputs.amountMin;
    return encoded as Hex;
}

export const encodeTransfer = (inputs: Transfer): Hex => {
    let encoded = "0x";
    encoded += inputs.token;
    encoded += inputs.recipient;
    encoded += inputs.value;
    return encoded as Hex;
}

export const encodePayPortion = (inputs: PayPortion): Hex => {
    let encoded = "0x";
    encoded += inputs.token;
    encoded += inputs.recipient;
    encoded += inputs.bips;
    return encoded as Hex;
}

export const encodeV2SwapExactIn = (inputs: V2SwapExactIn): Hex => {
    let encoded = "0x";
    encoded += inputs.recipient;
    encoded += inputs.amountIn;
    encoded += inputs.amountOutMin;
    encoded += inputs.routes;
    encoded += inputs.payerIsUser;
    return encoded as Hex;
}

export const encodeV2SwapExactOut = (inputs: V2SwapExactOut): Hex => {
    let encoded = "0x";
    encoded += inputs.recipient;
    encoded += inputs.amountOut;
    encoded += inputs.amountInMax;
    encoded += inputs.routes;
    encoded += inputs.payerIsUser;
    return encoded as Hex;
}

export const encodePermit2Permit = (inputs: Permit2Permit): Hex => {
    let encoded = "0x";
    encoded += inputs.permit;
    encoded += inputs.spender;
    encoded += inputs.sigDeadline;
    return encoded as Hex;
}

export const encodeWrapEth = (inputs: WrapEth): Hex => {
    let encoded = "0x";
    encoded += inputs.recipient;
    encoded += inputs.amountMin;
    return encoded as Hex;
}

export const encodeUnwrapWeth = (inputs: UnwrapWeth): Hex => {
    let encoded = "0x";
    encoded += inputs.recipient;
    encoded += inputs.amountMin;
    return encoded as Hex;
}

export const encodePermit2TransferFromBatch = (inputs: Permit2TransferFromBatch): Hex => {
    let encoded = "0x";
    encoded += inputs.transfers;
    return encoded as Hex;
}

export const encodeBalanceCheckErc20 = (inputs: BalanceCheckErc20): Hex => {
    let encoded = "0x";
    encoded += inputs.owner;
    encoded += inputs.token;
    encoded += inputs.minBalance;
    return encoded as Hex;
}

export const encodeOwnerCheck721 = (inputs: OwnerCheck721): Hex => {
    let encoded = "0x";
    encoded += inputs.owner;
    encoded += inputs.token;
    encoded += inputs.id;
    return encoded as Hex;
}

export const encodeOwnerCheck1155 = (inputs: OwnerCheck1155): Hex => {
    let encoded = "0x";
    encoded += inputs.owner;
    encoded += inputs.token;
    encoded += inputs.id;
    encoded += inputs.minBalance;
    return encoded as Hex;
}

export const encodeSweepErc721 = (inputs: SweepErc721): Hex => {
    let encoded = "0x";
    encoded += inputs.token;
    encoded += inputs.recipient;
    encoded += inputs.id;
    return encoded as Hex;
}

export const encodeSweepErc1155 = (inputs: SweepErc1155): Hex => {
    let encoded = "0x";
    encoded += inputs.token;
    encoded += inputs.recipient;
    encoded += inputs.id;
    encoded += inputs.amount;
    return encoded as Hex;
}

export const encodeApproveErc20 = (inputs: ApproveErc20): Hex => {
    let encoded = "0x";
    encoded += inputs.token;
    encoded += inputs.spender;
    return encoded as Hex;
}

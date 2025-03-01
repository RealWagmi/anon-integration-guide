import { ChainId } from '@heyanon/sdk';
import { Address, Hex } from "viem";

export const supportedChains = [ChainId.BASE];

export const POOL_FACTORY_ADDRESS = '0x5e7BB104d84c7CB9B682AaC2F3d509f5F406809A';
export const MIXED_QUOTER_ADDRESS = '0x0A5aA5D3a4d28014f967Bf0f29EAA3FF9807D5c6';
export const UNIVERSAL_ROUTER_ADDRESS = '0x6cb442acf35158d5eda88fe602221b67b400be3e';

export const FEE_SIZE = 3;

export const FEE_AMOUNTS = {
    V3_LOW: 500,
    V3_MEDIUM: 3000,
    V3_HIGH: 10000,
    V2_VOLATILE: 4194304,
    V2_STABLE: 2097152,
} as const;

export type FeeAmount = keyof typeof FEE_AMOUNTS;

export const enum CommandCode {
    // first boundary
    V3_SWAP_EXACT_IN = '00',
    V3_SWAP_EXACT_OUT = '01',
    PERMIT2_TRANSFER_FROM = '02',
    PERMIT2_PERMIT_BATCH = '03',
    SWEEP = '04',
    TRANSFER = '05',
    PAY_PORTION = '06',
    // second boundary
    V2_SWAP_EXACT_IN = '08',
    V2_SWAP_EXACT_OUT = '09',
    PERMIT2_PERMIT = '0a',
    WRAP_ETH = '0b',
    UNWRAP_WETH = '0c',
    PERMIT2_TRANSFER_FROM_BATCH = '0d',
    BALANCE_CHECK_ERC20 = '0e',
    // third boundary
    OWNER_CHECK_721 = '15',
    OWNER_CHECK_1155 = '16',
    SWEEP_ERC721 = '17',
    // fourth boundary
    SWEEP_ERC1155 = '1d',
    // fifth boundary
    APPROVE_ERC20 = '22',
}

export type V3SwapExactIn = {
    commandCode: CommandCode.V3_SWAP_EXACT_IN
    recipient: Address;
    amountIn: bigint;
    amountOutMin: bigint;
    path: Hex;
    payerIsUser: boolean;
}

export type V3SwapExactOut = {
    commandCode: CommandCode.V3_SWAP_EXACT_OUT;
    recipient: Address;
    amountOut: bigint;
    amountInMax: bigint;
    path: Hex;
    payerIsUser: boolean;
}

export type Permit2TransferFrom = {
    commandCode: CommandCode.PERMIT2_TRANSFER_FROM;
    token: Address;
    recipient: Address;
    amount: bigint;
}

export type Permit = {
    token: Address;
    amount: bigint;
    expiration: bigint;
    nonce: bigint;
}

export type PermitBatch = {
    permits: Permit[];
    spender: Address;
    sigDeadline: bigint;
}

export type Permit2PermitBatch = {
    commandCode: CommandCode.PERMIT2_PERMIT_BATCH;
    batch: PermitBatch;
    signature: Hex;
}

export type Sweep = {
    commandCode: CommandCode.SWEEP;
    token: Address;
    recipient: Address;
    amountMin: bigint;
}

export type Transfer = {
    commandCode: CommandCode.TRANSFER;
    token: Address;
    recipient: Address;
    value: bigint;
}

export type PayPortion = {
    commandCode: CommandCode.PAY_PORTION;
    token: Address;
    recipient: Address;
    bips: bigint;
}

export type Route = {
    from: Address;
    to: Address;
    stable: boolean;
}

export type V2SwapExactIn = {
    commandCode: CommandCode.V2_SWAP_EXACT_IN;
    recipient: Address;
    amountIn: bigint;
    amountOutMin: bigint;
    routes: Route[];
    payerIsUser: boolean;
}

export type V2SwapExactOut = {
    commandCode: CommandCode.V2_SWAP_EXACT_OUT;
    recipient: Address;
    amountOut: bigint;
    amountInMax: bigint;
    routes: Route[];
    payerIsUser: boolean;
}

export type PermitSingle = {
    permit: Permit;
    spender: Address;
    sigDeadline: bigint;
}

export type Permit2Permit = {
    commandCode: CommandCode.PERMIT2_PERMIT;
    single: PermitSingle;
    signature: Hex;
}

export type WrapEth = {
    commandCode: CommandCode.WRAP_ETH;
    recipient: Address;
    amountMin: bigint;
}

export type UnwrapWeth = {
    commandCode: CommandCode.UNWRAP_WETH;
    recipient: Address;
    amountMin: bigint;
}

export type AllowanceTransfer = {
    from: Address;
    to: Address;
    amount: bigint;
    token: Address;
}

export type Permit2TransferFromBatch = {
    commandCode: CommandCode.PERMIT2_TRANSFER_FROM_BATCH;
    transfers: AllowanceTransfer[];
}

export type BalanceCheckErc20 = {
    commandCode: CommandCode.BALANCE_CHECK_ERC20;
    owner: Address;
    token: Address;
    minBalance: bigint;
}

export type OwnerCheck721 = {
    commandCode: CommandCode.OWNER_CHECK_721;
    owner: Address;
    token: Address;
    id: bigint;
}

export type OwnerCheck1155 = {
    commandCode: CommandCode.OWNER_CHECK_1155;
    owner: Address;
    token: Address;
    id: bigint;
    minBalance: bigint;
}

export type SweepErc721 = {
    commandCode: CommandCode.SWEEP_ERC721;
    token: Address;
    recipient: Address;
    id: bigint;
}

export type SweepErc1155 = {
    commandCode: CommandCode.SWEEP_ERC1155;
    token: Address;
    recipient: Address;
    id: bigint;
    amount: bigint;
}

export type ApproveErc20 = {
    commandCode: CommandCode.APPROVE_ERC20;
    token: Address;
    spender: Address;
}

export type CommandList = {
    commands: Array<
        V3SwapExactIn
        | V3SwapExactOut
        | Permit2TransferFrom
        | Permit2PermitBatch
        | Sweep
        | Transfer
        | PayPortion
        | V2SwapExactIn
        | V2SwapExactOut
        | Permit2Permit
        | WrapEth
        | UnwrapWeth
        | Permit2TransferFromBatch
        | BalanceCheckErc20
        | OwnerCheck721
        | OwnerCheck1155
        | SweepErc721
        | SweepErc1155
        | ApproveErc20
    >;
}

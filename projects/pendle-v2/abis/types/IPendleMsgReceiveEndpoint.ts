export interface IPendleMsgReceiveEndpoint {
    executeMessage(
        srcChainId: number,
        srcAddress: string,
        message: string,
        executor: string
    ): Promise<void>;

    calcFee(
        dstChainId: number,
        message: string
    ): Promise<bigint>;

    sendMessage(
        dstChainId: number,
        dstAddress: string,
        message: string,
        refundAddress: string,
        zroPaymentAddress: string,
        adapterParams: string
    ): Promise<void>;
} 
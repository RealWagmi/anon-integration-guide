import { FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';

export async function getDescription(_: any, __: FunctionOptions): Promise<FunctionReturn> {
    return toResult(
        "Hypersonic is a DEX aggregator optimizing trades on Sonic. " +
        "It finds the best routes across multiple DEXs to get you the best possible price for your swaps. " +
        "Key features:\n" +
        "• Best price execution through smart routing\n" +
        "• Support for all major tokens on Sonic chain\n" +
        "• Low slippage through optimized routing\n" +
        "• Efficient gas usage\n\n" +
        "To use Hypersonic, you can:\n" +
        "1. Get a quote to see expected output for a swap\n" +
        "2. Execute swaps between any supported tokens\n" +
        "Note: Enjoy routed swaps at Sonic speed Anon!"
    );
}
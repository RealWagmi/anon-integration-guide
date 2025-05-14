import { FunctionOptions } from "@heyanon/sdk";
import { Exchange } from "ccxt";

/**
 * A version of HeyAnon SDK "FunctionOptions" that includes
 * a CCXT exchange instance, which allows the function
 * to call CCXT methods directly.
 */
export interface FunctionOptionsWithExchange extends FunctionOptions {
    exchange: Exchange;
}

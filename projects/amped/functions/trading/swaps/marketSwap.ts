import { type Address, encodeFunctionData, getAddress } from 'viem';
import { FunctionReturn, FunctionOptions, toResult, getChainFromName, TransactionParams, checkToApprove } from '@heyanon/sdk';
import { CONTRACT_ADDRESSES, NETWORKS } from '../../../constants.js';
import { Router } from '../../../abis/Router.js';
import { Vault } from '../../../abis/Vault.js';
import { getUserTokenBalances } from '../../liquidity/getUserTokenBalances.js';
import { getSwapsLiquidity } from '../swaps/getSwapsLiquidity.js';
import { ERC20 } from '../../../abis/ERC20.js';
import { formatUnits } from 'viem';
import { decodeEventLog } from 'viem';

type TokenSymbol = 'S' | 'WS' | 'WETH' | 'ANON' | 'USDC' | 'EURC';

interface Props {
    chainName: (typeof NETWORKS)[keyof typeof NETWORKS];
    account: Address;
    tokenIn: TokenSymbol;
    tokenOut: TokenSymbol;
    amountIn: string;
    slippageBps?: number;
}

// Helper function to get token address
function getTokenAddress(symbol: TokenSymbol): Address {
    const address = CONTRACT_ADDRESSES[NETWORKS.SONIC][
        symbol === 'S' ? 'NATIVE_TOKEN' :
        symbol === 'WS' ? 'WRAPPED_NATIVE_TOKEN' :
        symbol === 'WETH' ? 'WETH' :
        symbol === 'ANON' ? 'ANON' :
        symbol === 'USDC' ? 'USDC' :
        'EURC'
    ];
    return address;
}

const TOKEN_DECIMALS: Record<TokenSymbol, number> = {
    S: 18,
    WS: 18,
    WETH: 18,
    ANON: 18,
    USDC: 6,
    EURC: 6,
} as const;

// Helper function to convert BigInt values to strings for logging
function convertBigIntsToString(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'bigint') return obj.toString();
    if (Array.isArray(obj)) return obj.map(convertBigIntsToString);
    if (typeof obj === 'object') {
        return Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, convertBigIntsToString(value)]));
    }
    return obj;
}

/**
 * Executes a market swap between two tokens on Amped Finance
 * @param props - The swap parameters
 * @param props.chainName - The name of the chain (must be "sonic")
 * @param props.account - The account address executing the swap
 * @param props.tokenIn - The token to swap from
 * @param props.tokenOut - The token to swap to
 * @param props.amountIn - The amount of tokenIn to swap
 * @param props.slippageBps - Optional slippage tolerance in basis points (1 bps = 0.01%)
 * @param options - System tools for blockchain interactions
 * @returns Transaction result with swap details
 */
export async function marketSwap(
    { chainName, account, tokenIn, tokenOut, amountIn, slippageBps = 100 }: Props,
    { notify, getProvider, sendTransactions }: FunctionOptions,
): Promise<FunctionReturn> {
    // Validate chain using SDK helper
    const chainId = getChainFromName(chainName);
    if (!chainId) {
        return toResult(`Unsupported chain name: ${chainName}`, true);
    }
    if (chainName !== NETWORKS.SONIC) {
        return toResult('This function is only supported on Sonic chain', true);
    }

    // Validate tokens
    if (tokenIn === tokenOut) {
        return toResult('Cannot swap token to itself', true);
    }

    if (!getTokenAddress(tokenIn) || !getTokenAddress(tokenOut)) {
        return toResult(`Invalid token symbol. Supported tokens are: ${Object.keys(getTokenAddress).join(', ')}`, true);
    }

    try {
        await notify('Checking token balances and liquidity...');

        // Check user's token balances
        const balanceResult = await getUserTokenBalances({ chainName, account }, { getProvider, notify, sendTransactions });

        if (!balanceResult.success) {
            return toResult(`Failed to check token balances: ${balanceResult.data}`, true);
        }

        const balances = JSON.parse(balanceResult.data).tokens;
        const tokenBalance = balances.find((t: any) => t.symbol === tokenIn);

        if (!tokenBalance) {
            return toResult(`Failed to find balance for ${tokenIn}`, true);
        }

        // Convert input amount to proper decimals
        const amountInBigInt = BigInt(Math.floor(parseFloat(amountIn) * Math.pow(10, TOKEN_DECIMALS[tokenIn])).toString());

        // Check if user has sufficient balance
        if (BigInt(tokenBalance.balance) < amountInBigInt) {
            return toResult(`Insufficient ${tokenIn} balance. You have ${formatUnits(BigInt(tokenBalance.balance), TOKEN_DECIMALS[tokenIn])} ${tokenIn}, but tried to swap ${amountIn} ${tokenIn}`, true);
        }

        // Special case: S to WS conversion uses deposit function
        if (tokenIn === 'S' && tokenOut === 'WS') {
            await notify('Converting S to WS using deposit...');
            const depositData = encodeFunctionData({
                abi: [{
                    inputs: [],
                    name: 'deposit',
                    outputs: [],
                    stateMutability: 'payable',
                    type: 'function',
                }],
                functionName: 'deposit',
                args: [],
            });

            const transaction: TransactionParams = {
                target: getTokenAddress('WS'),
                data: depositData,
                value: amountInBigInt,
            };

            const txResult = await sendTransactions({
                chainId,
                account,
                transactions: [transaction],
            });

            if (!txResult.data) {
                return toResult(`Deposit failed: No transaction hash returned`, true);
            }

            return toResult(
                JSON.stringify({
                    success: true,
                    tokenIn,
                    tokenOut,
                    amountIn: amountInBigInt.toString(),
                    txHash: txResult.data,
                }),
            );
        }

        // Special case: WS to S conversion uses withdraw function
        if (tokenIn === 'WS' && tokenOut === 'S') {
            await notify('Converting WS to S using withdraw...');
            const transactions: TransactionParams[] = [];
            const provider = getProvider(chainId);

            // Check and prepare approve transaction if needed
            await checkToApprove({
                args: {
                    account,
                    target: getTokenAddress('WS'),
                    spender: getTokenAddress('WS'),
                    amount: amountInBigInt
                },
                provider,
                transactions
            });

            // Add withdraw transaction
            const withdrawData = encodeFunctionData({
                abi: [{
                    inputs: [{ name: 'value', type: 'uint256' }],
                    name: 'withdraw',
                    outputs: [],
                    stateMutability: 'nonpayable',
                    type: 'function',
                }],
                functionName: 'withdraw',
                args: [amountInBigInt],
            });

            transactions.push({
                target: getTokenAddress('WS'),
                data: withdrawData,
                value: 0n,
            });

            const txResult = await sendTransactions({
                chainId,
                account,
                transactions,
            });

            if (!txResult.data) {
                return toResult(`Withdraw failed: No transaction hash returned`, true);
            }

            return toResult(
                JSON.stringify({
                    success: true,
                    tokenIn,
                    tokenOut,
                    amountIn: amountInBigInt.toString(),
                    txHash: txResult.data,
                }),
            );
        }

        // For all other cases, proceed with normal swap logic
        // Check liquidity
        const liquidityResult = await getSwapsLiquidity({ chainName, account }, { getProvider, notify, sendTransactions });

        if (!liquidityResult.success) {
            return toResult(`Failed to check liquidity: ${liquidityResult.data}`, true);
        }

        // Parse liquidity data and validate amounts
        const liquidityData = JSON.parse(liquidityResult.data);
        const tokenOutLiquidity = liquidityData.liquidity.find((l: any) => l.symbol === tokenOut);

        if (!tokenOutLiquidity) {
            return toResult(`Failed to find liquidity data for ${tokenOut}`, true);
        }

        // Check if there's sufficient available liquidity for the output token
        const availableOutAmount = BigInt(tokenOutLiquidity.availableAmount);
        if (availableOutAmount <= 0n) {
            return toResult(`No available liquidity for ${tokenOut} in the pool`, true);
        }

        // Additional safety check for minimum pool amount (0.1% of current pool)
        const minPoolAmount = availableOutAmount / 1000n;
        if (availableOutAmount <= minPoolAmount) {
            return toResult(`Pool liquidity for ${tokenOut} (${formatUnits(availableOutAmount, TOKEN_DECIMALS[tokenOut])} ${tokenOut}) is too low for swaps`, true);
        }

        // Calculate minimum output amount with slippage tolerance
        const minOutBigInt = (availableOutAmount * BigInt(10000 - slippageBps)) / BigInt(10000);

        const provider = getProvider(chainId);

        // Prepare transaction data
        const transactions: TransactionParams[] = [];

        // Add approval transaction if needed for non-native token swaps
        if (tokenIn !== 'S') {
            const allowance = (await provider.readContract({
                address: getTokenAddress(tokenIn),
                abi: ERC20,
                functionName: 'allowance',
                args: [account, CONTRACT_ADDRESSES[NETWORKS.SONIC].ROUTER],
            })) as bigint;

            if (allowance < amountInBigInt) {
                const approvalData = encodeFunctionData({
                    abi: ERC20,
                    functionName: 'approve',
                    args: [CONTRACT_ADDRESSES[NETWORKS.SONIC].ROUTER, amountInBigInt],
                });

                transactions.push({
                    target: getTokenAddress(tokenIn),
                    data: approvalData,
                    value: 0n,
                });
            }
        }

        // Prepare swap path
        const tokenInAddress = tokenIn === 'S' ? CONTRACT_ADDRESSES[NETWORKS.SONIC].WRAPPED_NATIVE_TOKEN : getTokenAddress(tokenIn);
        const tokenOutAddress = tokenOut === 'S' ? CONTRACT_ADDRESSES[NETWORKS.SONIC].WRAPPED_NATIVE_TOKEN : getTokenAddress(tokenOut);

        console.log('Token addresses:', {
            tokenInAddress,
            tokenOutAddress,
            account
        });

        // For ETH to token swaps, construct the path with checksummed addresses
        const path = tokenIn === 'S' 
            ? [getAddress(CONTRACT_ADDRESSES[NETWORKS.SONIC].WRAPPED_NATIVE_TOKEN), getAddress(tokenOutAddress)] 
            : tokenOut === 'S'
            ? [getAddress(tokenInAddress), getAddress(CONTRACT_ADDRESSES[NETWORKS.SONIC].WRAPPED_NATIVE_TOKEN)]
            : [getAddress(tokenInAddress), getAddress(tokenOutAddress)];

        console.log('Swap path:', path);
        console.log('Function:', tokenIn === 'S' ? 'swapETHToTokens' : tokenOut === 'S' ? 'swapTokensToETH' : 'swapTokensToTokens');

        // Add swap transaction
        const swapData = encodeFunctionData({
            abi: Router,
            functionName: tokenIn === 'S' ? 'swapETHToTokens' : tokenOut === 'S' ? 'swapTokensToETH' : 'swapTokensToTokens',
            args:
                tokenIn === 'S'
                    ? [path, 0n, getAddress(account)]
                    : tokenOut === 'S'
                    ? [path, amountInBigInt, 0n, getAddress(account)]
                    : [path, amountInBigInt, 0n, getAddress(account)],
        });

        console.log('Swap args:', tokenIn === 'S'
            ? { path, minOut: '0', receiver: account }
            : { path, amountIn: amountInBigInt.toString(), minOut: '0', receiver: account }
        );

        transactions.push({
            target: CONTRACT_ADDRESSES[NETWORKS.SONIC].ROUTER,
            data: swapData,
            value: tokenIn === 'S' ? amountInBigInt : 0n,
        });

        await notify('Executing swap transaction...');

        // Send transactions
        const result = await sendTransactions({
            chainId,
            account,
            transactions,
        });

        if (!result.data?.[0]?.hash) {
            return toResult('Transaction failed: No transaction hash returned', true);
        }

        // Get transaction receipt and parse Swap event
        const receipt = await provider.getTransactionReceipt({ hash: result.data[0].hash });

        const swapEvents = receipt.logs.filter(log => {
            return log.address.toLowerCase() === CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT.toLowerCase() &&
                   log.topics[0] === '0x0874b2d545cb271cdbda4e093020c452328b24af34e886f927f48e67422d4c95'; // keccak256('Swap(address,address,address,uint256,uint256,uint256,uint256)')
        });

        if (swapEvents.length === 0) {
            return toResult(
                JSON.stringify({
                    success: true,
                    hash: result.data[0].hash,
                    details: {
                        tokenIn,
                        tokenOut,
                        amountIn: formatUnits(amountInBigInt, TOKEN_DECIMALS[tokenIn]),
                        minOut: formatUnits(minOutBigInt, TOKEN_DECIMALS[tokenOut]),
                        warning: 'Could not parse Swap event from transaction receipt'
                    },
                }),
            );
        }

        // Parse the event data
        const eventData = swapEvents[0];
        const decodedEvent = decodeEventLog({
            abi: [{
                anonymous: false,
                inputs: [
                    { indexed: false, name: 'account', type: 'address' },
                    { indexed: false, name: 'tokenIn', type: 'address' },
                    { indexed: false, name: 'tokenOut', type: 'address' },
                    { indexed: false, name: 'amountIn', type: 'uint256' },
                    { indexed: false, name: 'amountOut', type: 'uint256' },
                    { indexed: false, name: 'amountOutAfterFees', type: 'uint256' },
                    { indexed: false, name: 'feeBasisPoints', type: 'uint256' }
                ],
                name: 'Swap',
                type: 'event'
            }],
            data: eventData.data,
            topics: eventData.topics
        });

        // Verify the event data matches our expectations
        const expectedTokenIn = tokenIn === 'S' ? getTokenAddress('WS') : getTokenAddress(tokenIn);
        const expectedTokenOut = tokenOut === 'S' ? getTokenAddress('WS') : getTokenAddress(tokenOut);

        if (decodedEvent.args.account.toLowerCase() !== account.toLowerCase() ||
            decodedEvent.args.tokenIn.toLowerCase() !== expectedTokenIn.toLowerCase() ||
            decodedEvent.args.tokenOut.toLowerCase() !== expectedTokenOut.toLowerCase()) {
            return toResult(
                `Swap event validation failed. Expected account ${account}, tokenIn ${expectedTokenIn}, and tokenOut ${expectedTokenOut}, but got account ${decodedEvent.args.account}, tokenIn ${decodedEvent.args.tokenIn}, and tokenOut ${decodedEvent.args.tokenOut}`,
                true
            );
        }

        // Verify the amount received is not less than minOut
        if (decodedEvent.args.amountOutAfterFees < minOutBigInt) {
            return toResult(
                `Received amount ${decodedEvent.args.amountOutAfterFees} is less than minimum expected ${minOutBigInt}`,
                true
            );
        }

        return toResult(
            JSON.stringify({
                success: true,
                hash: result.data[0].hash,
                details: {
                    tokenIn,
                    tokenOut,
                    amountIn: formatUnits(amountInBigInt, TOKEN_DECIMALS[tokenIn]),
                    minOut: formatUnits(minOutBigInt, TOKEN_DECIMALS[tokenOut]),
                    receivedAmount: formatUnits(decodedEvent.args.amountOutAfterFees, TOKEN_DECIMALS[tokenOut]),
                    amountBeforeFees: formatUnits(decodedEvent.args.amountOut, TOKEN_DECIMALS[tokenOut]),
                    feeBasisPoints: Number(decodedEvent.args.feeBasisPoints),
                },
            }),
        );
    } catch (error) {
        if (error instanceof Error) {
            return toResult(`Market swap failed: ${error.message}`, true);
        }
        return toResult('Market swap failed: Unknown error', true);
    }
}

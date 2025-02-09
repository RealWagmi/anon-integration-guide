import { FunctionReturn, FunctionOptions, toResult, checkToApprove, TransactionParams } from '@heyanon/sdk';
import { supportedChains, protocolContracts, lowRange, highRange } from '../constants';
import { Address, parseUnits, encodeFunctionData, parseAbi } from 'viem';
import { ethers } from 'ethers';
import { NonfungiblePositionManagerABI } from '../abis/NonfungiblePositionManagerABI';
import { checkPoolExists, calculateTokenPrices, getPriceAndTickFromValues } from './utils';

interface Props {
    account: Address;
    tokenAddress: Address;
    tokenAmount: string;
    chainId: number;
}

/**
 * Add One-Sided Liquidity on Uniswap V3.
 * For Arbitrum: Make Pair with Hermes Token
 * For Base: Make Pair with Goddog Token
 * 
 * @param props - The function parameters
 * @param props.account - Account
 * @param props.tokenAddress - Optional specific token address to make pair with basic token
 * @param props.tokenAmount - Optional specific token amount
 * @param props.chainId - Chain ID to add liquidity
 * @returns transaction Result
 */
export async function addLiquidityOnUniswapV3(
    { account, tokenAddress, tokenAmount, chainId }: Props,
    { notify, getProvider, sendTransactions }: FunctionOptions,
): Promise<FunctionReturn> {
    try {
        // Check wallet connection
        if (!account) return toResult('Wallet not connected', true);
        if (!supportedChains.includes(chainId)) return toResult('Wallet not connected', true);
        await notify('Adding liquidity on Uniswap V3...');

        const chain = supportedChains[0] === chainId ? 0 : 1;
        const provider = getProvider(chainId);
        let address1 = tokenAddress;
        let address2 = protocolContracts[chain].BasicTokenAddress;
        const token0 = address1 < address2 ? address1 : address2;
        const token1 = address1 < address2 ? address2 : address1;
        const isToken0 = address1 < address2;
        const fee = 10000;
        const poolExists = await checkPoolExists(token0, token1, Number(fee), provider, chain);
        if(poolExists) return toResult("Pool Already Exist", true);
        const transactions: TransactionParams[] = [];
        const _decimal = await provider.readContract({
            address: tokenAddress,
            abi: parseAbi(['function decimals() public view returns (uint256)']),
            functionName: 'decimals',
            args: [],
        });
        const amountInWei = parseUnits(tokenAmount, Number(_decimal));
        await notify('Checking approve...');
        // Check and prepare approve transaction if needed
        await checkToApprove({
            args: {
                account,
                target: tokenAddress,
                spender: protocolContracts[chain].routerAddress as Address,
                amount: amountInWei,
            },
            provider,
            transactions,
        });

        const [price1, price2] = await calculateTokenPrices(token0, token1);

        let currentPrice = Number(price1) / Number(price2);
        const createFunctionSignature = 'createAndInitializePoolIfNecessary(address,address,uint24,uint160)';
        // Calculate initial sqrt price based on current price
        const lowerPrice = isToken0 ? currentPrice * lowRange : currentPrice / lowRange;
        const upperPrice = isToken0 ? currentPrice * highRange : currentPrice / highRange;
        const resLower = getPriceAndTickFromValues(lowerPrice);
        const resUpper = getPriceAndTickFromValues(upperPrice);
        const tickLower = isToken0 ? resLower.tick + 200 : resUpper.tick;
        const tickUpper = isToken0 ? resUpper.tick : resLower.tick - 200;
        const sqrtPrice = resLower.price;
        const iface = new ethers.Interface(NonfungiblePositionManagerABI);
        const params1 = [token0, token1, fee, BigInt(sqrtPrice)];
        console.log("params1: ", params1);
        const data1 = iface.encodeFunctionData(createFunctionSignature, params1);
        const mintFunctionSignature = 'mint((address,address,uint24,int24,int24,uint256,uint256,uint256,uint256,address,uint256))';
        const params2 = [
            {
                token0: token0,
                token1: token1,
                fee: fee,
                tickLower: tickLower,
                tickUpper: tickUpper,
                amount0Desired: isToken0 ? amountInWei : 0,
                amount1Desired: !isToken0 ? amountInWei : 0,
                amount0Min: 0,
                amount1Min: 0,
                recipient: account,
                deadline: BigInt(Math.floor(Date.now() / 1000) + 1200),
            },
        ];
        const data2 = iface.encodeFunctionData(mintFunctionSignature, params2);
        const txData = [data1, data2];

        // Prepare borrow transaction
        const tx: TransactionParams = {
            target: protocolContracts[chain].routerAddress as Address,
            data: encodeFunctionData({
                abi: NonfungiblePositionManagerABI,
                functionName: 'multicall',
                args: [txData],
            }),
        };
        transactions.push(tx);
        await notify("Waiting for transaction confirmation...");

        const result = await sendTransactions({ chainId, account, transactions });
        const returnMessage = result.data[result.data.length - 1];
        return toResult(
            result.isMultisig
              ? returnMessage.message
              : `Successfully added One-Sided Liquidity with ${tokenAmount}. ${returnMessage.message}`
          );
    } catch (error) {
        return toResult(`Failed to add liquidity: ${error}`, true);
    }
}

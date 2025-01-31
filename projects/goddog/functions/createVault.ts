import { FunctionReturn, FunctionOptions, toResult, TransactionParams } from '@heyanon/sdk';
import { supportedChains, protocolContracts, managerAddress, maxTotalSupply } from '../constants';
import {  Address, zeroAddress, encodeFunctionData, parseAbi } from 'viem';
import { VaultFactoryABI } from '../abis/VaultFactoryABI';
import { getPairToken } from './utils';

interface Props {
    account: Address;
    poolAddress: Address;
    agentAddress: Address;
    chainId: number;
}

/**
 * Create a vault on Charming Protocol for specific Uniswap V3.
 *
 * @param props - The function parameters
 * @param props.account - Account
 * @param props.poolAddress - Optional pool address to create a new vault
 * @param props.agentAddress - Agent address that will call rebalance function on this vault
 * @param props.chainId - Chain ID to add liquidity
 * @returns transaction Result
 */
export async function createVault(
    { account, poolAddress, agentAddress, chainId }: Props,
    { notify, getProvider, sendTransactions }: FunctionOptions,
): Promise<FunctionReturn> {
    try {
        // Check wallet connection
        if (!account) return toResult('Wallet not connected', true);
        if (!supportedChains.includes(chainId)) return toResult('Wallet not connected', true);
        await notify('Creating new vault...');

        const chain = supportedChains[0] === chainId ? 0 : 1;
        const provider = getProvider(chainId);
        const transactions: TransactionParams[] = [];
        const pairToken = await getPairToken(poolAddress, provider, chain);
        if(pairToken == zeroAddress) {
            return toResult('Invalid Pool Address', true);
        }
        const symbol = await provider.readContract({
            address: pairToken as Address,
            abi: parseAbi(['function symbol() public view returns (string)']),
            functionName: 'symbol',
            args: [],
        });
        const param = {
            pool: poolAddress,
            manager: managerAddress,
            managerFee: 59420,
            rebalanceDelegate: agentAddress,
            maxTotalSupply: BigInt(maxTotalSupply),
            baseThreshold: 5400,
            limitThreshold: 12000,
            fullRangeWeight: 200000,
            period: 3,
            minTickMove: 0,
            maxTwapDeviation: 100,
            twapDuration: 60,
            name: `Charming ${symbol} by GODDOG`,
            symbol: `v${symbol}`,
        };

        // Prepare borrow transaction
        const tx: TransactionParams = {
            target: protocolContracts[chain].vaultFactoryAddress as Address,
            data: encodeFunctionData({
                abi: VaultFactoryABI,
                functionName: 'createVault',
                args: [param],
            }),
        };
        transactions.push(tx);
        await notify('Waiting for transaction confirmation...');

        const result = await sendTransactions({ chainId, account, transactions });
        const returnMessage = result.data[result.data.length - 1];
        return toResult(result.isMultisig ? returnMessage.message : `Successfully created new vault for ${poolAddress}. ${returnMessage.message}`);
    } catch (error) {
        return toResult(`Failed to create vault: ${error}`, true);
    }
}

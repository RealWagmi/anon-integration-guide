import { describe, it, expect, vi } from 'vitest';
import { ethers } from 'ethers';
import { createPublicClient, http, parseUnits, formatUnits, createWalletClient, custom, Address, getContract } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { CONTRACT_ADDRESSES, NETWORKS, RPC_URLS } from '../../constants.js';
import { FunctionOptions, TransactionReturn, TransactionReturnData } from '@heyanon/sdk';
import { removeLiquidity } from './removeLiquidity.js';
import { getUserLiquidity } from './getUserLiquidity.js';
import { getPoolLiquidity } from './getPoolLiquidity.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Extend window type to include ethereum
declare global {
    interface Window {
        ethereum: any;
    }
}

describe('removeLiquidity', () => {
    // Test configuration
    const testAccount = (process.env.TEST_WALLET_ADDRESS || '0xB1A9056a5921C0F6f2C68Ce19E08cA9A6D5FD904') as `0x${string}`;
    const chainName = 'sonic';
    const isLiveTest = process.env.LIVE_TESTING === 'true' && process.env.PRIVATE_KEY;
    
    // Create providers for testing
    const publicClient = createPublicClient({
        chain: {
            id: 146,
            name: 'Sonic',
            network: 'sonic',
            nativeCurrency: {
                name: 'Sonic',
                symbol: 'SONIC',
                decimals: 18
            },
            rpcUrls: {
                default: { http: [RPC_URLS[NETWORKS.SONIC]] }
            }
        },
        transport: http()
    });

    // Create wallet client for live testing
    const walletClient = isLiveTest ? createWalletClient({
        chain: publicClient.chain,
        transport: http(),
        account: privateKeyToAccount(process.env.TEST_WALLET_PRIVATE_KEY as `0x${string}`)
    }) : null;

    // Test options with conditional transaction handling
    const options: FunctionOptions = {
        notify: async (msg: string) => console.log('Notification:', msg),
        getProvider: () => publicClient,
        sendTransactions: async (params: any): Promise<TransactionReturn> => {
            console.log('Transaction params:', params);

            if (isLiveTest && walletClient) {
                try {
                    const hash = await walletClient.sendTransaction(params);
                    const receipt = await publicClient.waitForTransactionReceipt({ hash });
                    
                    return {
                        isMultisig: false,
                        data: [{
                            message: receipt.status === 'success' ? 'Transaction successful' : 'Transaction failed',
                            hash: receipt.transactionHash as `0x${string}`
                        }]
                    };
                } catch (error) {
                    console.error('Transaction failed:', error);
                    throw error;
                }
            }

            // Mock return for non-live testing
            return {
                isMultisig: false,
                data: [{
                    message: 'Mock transaction successful',
                    hash: '0x1234567890123456789012345678901234567890123456789012345678901234' as const
                }]
            };
        }
    };

    // Skip live tests if not configured
    if (!isLiveTest) {
        console.log('Running in mock mode. Set LIVE_TESTING=true and PRIVATE_KEY in .env to run live tests.');
    }

    // Helper functions to get liquidity information
    async function getCurrentBalance() {
        const result = await getUserLiquidity(
            { chainName, account: testAccount },
            options
        );
        const data = JSON.parse(result.data);
        return {
            total: data.balance,
            available: data.availableAmount,
            usdValue: data.availableUsdValue
        };
    }

    async function getTokenLiquidity(tokenAddress: string) {
        // Get pool liquidity first
        const poolResult = await getPoolLiquidity(chainName, options);
        const poolData = JSON.parse(poolResult.data);

        // Get token-specific liquidity from vault
        const vault = getContract({
            address: CONTRACT_ADDRESSES[chainName].VAULT as Address,
            abi: [{
                inputs: [{ name: '_token', type: 'address' }],
                name: 'poolAmounts',
                outputs: [{ type: 'uint256' }],
                stateMutability: 'view',
                type: 'function'
            }, {
                inputs: [{ name: '_token', type: 'address' }],
                name: 'reservedAmounts',
                outputs: [{ type: 'uint256' }],
                stateMutability: 'view',
                type: 'function'
            }],
            client: publicClient
        });

        const [poolAmount, reservedAmount] = await Promise.all([
            vault.read.poolAmounts([tokenAddress as Address]),
            vault.read.reservedAmounts([tokenAddress as Address])
        ]);

        const availableAmount = (poolAmount as bigint) - (reservedAmount as bigint);
        
        return {
            poolTotalSupply: poolData.totalSupply,
            poolAum: poolData.aum,
            tokenAvailable: formatUnits(availableAmount, tokenAddress.toLowerCase() === CONTRACT_ADDRESSES[chainName].USDC.toLowerCase() ? 6 : 18)
        };
    }

    // Helper function to calculate safe test amounts
    async function calculateTestAmounts(tokenAddress: string, percentOfAvailable: number = 0.01) {
        const { available, usdValue } = await getCurrentBalance();
        const { tokenAvailable } = await getTokenLiquidity(tokenAddress);
        
        // Use the smaller of user's available balance or pool's token liquidity
        const maxAmount = Math.min(
            parseFloat(available),
            parseFloat(tokenAvailable)
        );
        
        const testAmount = (maxAmount * percentOfAvailable).toString();
        const decimals = tokenAddress.toLowerCase() === CONTRACT_ADDRESSES[chainName].USDC.toLowerCase() ? 6 : 18;
        const minOut = (parseFloat(testAmount) * 0.95 * Math.pow(10, decimals)).toString();
        
        return { testAmount, minOut };
    }

    describe('Input Validation', () => {
        it('should reject missing parameters', async () => {
            const result = await removeLiquidity(
                {
                    chainName,
                    account: '',  // Missing account
                    tokenOut: CONTRACT_ADDRESSES[chainName].NATIVE_TOKEN,
                    amount: '1.0',
                    minOut: '0.95'
                },
                options
            );
            expect(result.data).toContain('Missing required parameters');
        });

        it('should reject invalid chain', async () => {
            const result = await removeLiquidity(
                {
                    chainName: 'invalid' as any,
                    account: testAccount,
                    tokenOut: CONTRACT_ADDRESSES[chainName].NATIVE_TOKEN,
                    amount: '1.0',
                    minOut: '0.95'
                },
                options
            );
            expect(result.data).toContain('not supported');
        });
    });

    describe('Native Token Redemption', () => {
        it('should prepare native token redemption transaction', async () => {
            const { testAmount, minOut } = await calculateTestAmounts(CONTRACT_ADDRESSES[chainName].NATIVE_TOKEN);
            
            const result = await removeLiquidity(
                {
                    chainName,
                    account: testAccount,
                    tokenOut: CONTRACT_ADDRESSES[chainName].NATIVE_TOKEN,
                    amount: testAmount,
                    minOut
                },
                options
            );
            expect(result.data).toBe('Successfully removed liquidity');
        });

        it('should fail if amount exceeds available balance', async () => {
            const { available } = await getCurrentBalance();
            const { tokenAvailable } = await getTokenLiquidity(CONTRACT_ADDRESSES[chainName].NATIVE_TOKEN);
            const maxAmount = Math.max(parseFloat(available), parseFloat(tokenAvailable));
            const tooMuch = (maxAmount * 1.1).toString();
            const minOut = (parseFloat(tooMuch) * 0.95 * 1e18).toString();
            
            const result = await removeLiquidity(
                {
                    chainName,
                    account: testAccount,
                    tokenOut: CONTRACT_ADDRESSES[chainName].NATIVE_TOKEN,
                    amount: tooMuch,
                    minOut
                },
                options
            );
            expect(result.data).toContain('Insufficient available');
        });
    });

    describe('ERC20 Token Redemption', () => {
        const usdcAddress = CONTRACT_ADDRESSES[chainName].USDC as `0x${string}`;
        const anonAddress = CONTRACT_ADDRESSES[chainName].ANON as `0x${string}`;

        it('should prepare USDC token redemption transaction', async () => {
            const { testAmount, minOut } = await calculateTestAmounts(usdcAddress);
            
            const result = await removeLiquidity(
                {
                    chainName,
                    account: testAccount,
                    tokenOut: usdcAddress,
                    amount: testAmount,
                    minOut
                },
                options
            );
            expect(result.data).toBe('Successfully removed liquidity');
        });

        it('should prepare ANON token redemption transaction', async () => {
            const { testAmount, minOut } = await calculateTestAmounts(anonAddress);
            
            const result = await removeLiquidity(
                {
                    chainName,
                    account: testAccount,
                    tokenOut: anonAddress,
                    amount: testAmount,
                    minOut
                },
                options
            );
            expect(result.data).toBe('Successfully removed liquidity');
        });
    });

    describe('Safety Checks', () => {
        it('should skip safety checks when specified', async () => {
            const { testAmount, minOut } = await calculateTestAmounts(CONTRACT_ADDRESSES[chainName].NATIVE_TOKEN, 0.05);
            
            const result = await removeLiquidity(
                {
                    chainName,
                    account: testAccount,
                    tokenOut: CONTRACT_ADDRESSES[chainName].NATIVE_TOKEN,
                    amount: testAmount,
                    minOut,
                    skipSafetyChecks: true
                },
                options
            );
            expect(result.data).toBe('Successfully removed liquidity');
        });
    });

    // Live test cases
    (isLiveTest ? describe : describe.skip)('Live Tests', () => {
        it('should successfully remove small amount of liquidity to native token', async () => {
            const { testAmount, minOut } = await calculateTestAmounts(CONTRACT_ADDRESSES[chainName].NATIVE_TOKEN, 0.001);
            
            const result = await removeLiquidity(
                {
                    chainName,
                    account: testAccount,
                    tokenOut: CONTRACT_ADDRESSES[chainName].NATIVE_TOKEN,
                    amount: testAmount,
                    minOut
                },
                options
            );
            expect(result.data).toBe('Successfully removed liquidity');
        });

        it('should successfully remove small amount of liquidity to USDC', async () => {
            const { testAmount, minOut } = await calculateTestAmounts(CONTRACT_ADDRESSES[chainName].USDC, 0.001);
            
            const result = await removeLiquidity(
                {
                    chainName,
                    account: testAccount,
                    tokenOut: CONTRACT_ADDRESSES[chainName].USDC,
                    amount: testAmount,
                    minOut
                },
                options
            );
            expect(result.data).toBe('Successfully removed liquidity');
        });

        it('should successfully remove small amount of liquidity to ANON', async () => {
            const { testAmount, minOut } = await calculateTestAmounts(CONTRACT_ADDRESSES[chainName].ANON, 0.001);
            
            const result = await removeLiquidity(
                {
                    chainName,
                    account: testAccount,
                    tokenOut: CONTRACT_ADDRESSES[chainName].ANON,
                    amount: testAmount,
                    minOut
                },
                options
            );
            expect(result.data).toBe('Successfully removed liquidity');
        });
    });
}); 

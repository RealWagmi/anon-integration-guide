import { createPublicClient, http, getContract, formatUnits, Address, Chain } from 'viem';
import { CONTRACT_ADDRESSES, NETWORKS } from '../../constants.js';
import { getPoolLiquidity } from '../../functions/liquidity/getPoolLiquidity.js';
import { FunctionOptions } from '@heyanon/sdk';
import 'dotenv/config';

// Define Sonic chain
export const sonic = {
    id: 146,
    name: 'Sonic',
    nativeCurrency: {
        decimals: 18,
        name: 'Sonic',
        symbol: 'SONIC',
    },
    rpcUrls: {
        default: { http: ['https://rpc.soniclabs.com'] },
        public: { http: ['https://rpc.soniclabs.com'] }
    },
    blockExplorers: {
        default: { name: 'SonicScan', url: 'https://explorer.sonic.oasys.games' }
    }
} as const satisfies Chain;

async function getTokenPrice(publicClient: any, tokenAddress: string) {
    const vault = getContract({
        address: CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT,
        abi: [{
            inputs: [{ name: '_token', type: 'address' }],
            name: 'getMinPrice',
            outputs: [{ type: 'uint256' }],
            stateMutability: 'view',
            type: 'function'
        }],
        client: publicClient
    });

    const price = await publicClient.readContract({
        ...vault,
        functionName: 'getMinPrice',
        args: [tokenAddress as Address]
    });

    return Number(formatUnits(price as bigint, 30)); // Price is in 30 decimals
}

async function getTokenLiquidity(publicClient: any, tokenAddress: string) {
    const vault = getContract({
        address: CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT,
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
        publicClient.readContract({
            ...vault,
            functionName: 'poolAmounts',
            args: [tokenAddress as Address]
        }),
        publicClient.readContract({
            ...vault,
            functionName: 'reservedAmounts',
            args: [tokenAddress as Address]
        })
    ]);

    const availableAmount = (poolAmount as bigint) - (reservedAmount as bigint);
    const decimals = tokenAddress.toLowerCase() === CONTRACT_ADDRESSES[NETWORKS.SONIC].USDC.toLowerCase() ? 6 : 18;
    const price = await getTokenPrice(publicClient, tokenAddress);
    
    const poolAmountFormatted = Number(formatUnits(poolAmount as bigint, decimals));
    const reservedAmountFormatted = Number(formatUnits(reservedAmount as bigint, decimals));
    const availableAmountFormatted = Number(formatUnits(availableAmount, decimals));
    
    return {
        poolAmount: poolAmountFormatted,
        reservedAmount: reservedAmountFormatted,
        availableAmount: availableAmountFormatted,
        price,
        poolAmountUsd: poolAmountFormatted * price,
        reservedAmountUsd: reservedAmountFormatted * price,
        availableAmountUsd: availableAmountFormatted * price,
        decimals
    };
}

async function test() {
    const transport = http('https://rpc.soniclabs.com');
    
    const provider = createPublicClient({
        chain: sonic,
        transport
    });

    console.log('Testing getPoolLiquidity function...');
    console.log('Using contracts:');
    console.log('- GLP Token:', CONTRACT_ADDRESSES[NETWORKS.SONIC].GLP_TOKEN);
    console.log('- GLP Manager:', CONTRACT_ADDRESSES[NETWORKS.SONIC].GLP_MANAGER);
    console.log('- Vault:', CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT);

    const options: FunctionOptions = {
        notify: async (msg: string) => console.log('Notification:', msg),
        getProvider: (_chainId: number) => provider,
        sendTransactions: async () => {
            throw new Error('sendTransactions should not be called in this test');
        }
    };

    try {
        // Get overall pool liquidity
        const result = await getPoolLiquidity(
            { chainName: 'sonic' },
            options
        );

        if (!result.success) {
            console.log('Error:', result.data);
            return;
        }

        const data = JSON.parse(result.data);
        console.log('\nPool Liquidity Information:');
        console.log('- Total Supply:', data.totalSupply, 'GLP');
        console.log('- Assets Under Management (AUM):', '$' + Number(data.aum).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 'USD');

        // Check liquidity for specific tokens
        console.log('\nToken-Specific Liquidity:');
        
        const tokens = {
            'USDC': CONTRACT_ADDRESSES[NETWORKS.SONIC].USDC,
            'NATIVE': CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN,
            'WETH': CONTRACT_ADDRESSES[NETWORKS.SONIC].WETH,
            'ANON': CONTRACT_ADDRESSES[NETWORKS.SONIC].ANON,
            'EURC': CONTRACT_ADDRESSES[NETWORKS.SONIC].EURC
        };

        for (const [symbol, address] of Object.entries(tokens)) {
            console.log(`\n${symbol}:`);
            const liquidity = await getTokenLiquidity(provider, address);
            console.log('- Pool Amount:', liquidity.poolAmount.toFixed(6), `${symbol} ($${liquidity.poolAmountUsd.toFixed(2)} USD)`);
            console.log('- Reserved Amount:', liquidity.reservedAmount.toFixed(6), `${symbol} ($${liquidity.reservedAmountUsd.toFixed(2)} USD)`);
            console.log('- Available Amount:', liquidity.availableAmount.toFixed(6), `${symbol} ($${liquidity.availableAmountUsd.toFixed(2)} USD)`);
            console.log('- Price:', `$${liquidity.price.toFixed(2)} USD`);
        }

    } catch (error) {
        console.error('Error testing pool liquidity:', error);
    }
}

test().catch(console.error); 
import { createPublicClient, createWalletClient, http, parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { addLiquidityOnUniswapV3, createVault, depositToVault, withdrawFromVault, rebalance } from '../functions/index';
import { TransactionReturnData, SendTransactionProps } from '@heyanon/sdk';
import { CHAIN_CONFIG, NETWORKS, RPC_URLS, CHAIN_IDS } from '../constants';
import dotenv from 'dotenv';
import { Address } from 'viem';

dotenv.config();

const privateKey = process.env.PRIVATE_KEY;
if (!privateKey) {
    throw new Error('Private key not found in environment variables');
}
const account = privateKeyToAccount(privateKey as `0x${string}`);

const chain = CHAIN_CONFIG[NETWORKS.ARBITRUM];

const publicClient = createPublicClient({
    chain,
    transport: http(RPC_URLS[NETWORKS.ARBITRUM]),
});

const walletClient = createWalletClient({
    account,
    chain,
    transport: http(RPC_URLS[NETWORKS.ARBITRUM]),
});

const sendTransactions = async ({ account, chainId, transactions }: SendTransactionProps) => {
    const txResults: TransactionReturnData[] = [];
    for (const tx of transactions) {
        // Use a fixed gas limit that we know is sufficient
        // const gasLimit = 1000000n;

        const hash = await walletClient.sendTransaction({
            // chain,
            to: tx.target as Address,
            data: tx.data as `0x${string}`,
            value: 0n,
            // gas: gasLimit
        });

        txResults.push({
            message: 'Transaction successful',
            hash: hash as `0x${string}`,
        });
    }
    return {
        success: true,
        message: 'Transaction successful',
        data: txResults,
        isMultisig: false,
    };
};

const notify = async (message: string) => {
    console.log(message);
};

const getProvider = () => {
    return publicClient;
};
const testAddLiquidity = async () => {
    try {
        const params = {
            account: account.address,
            tokenAddress: '0xc24A365A870821EB83Fd216c9596eDD89479d8d7' as `0x${string}`,
            tokenAmount: '0.01',
            chainId: CHAIN_IDS[NETWORKS.ARBITRUM],
        };
        const result = await addLiquidityOnUniswapV3(params, { notify, getProvider, sendTransactions });
        console.log('Transaction result:', result);
    } catch (error) {
        console.error('Error:', error);
    }
};
const testCreateVault = async () => {
    try {
        const params = {
            account: account.address,
            poolAddress: '0x843efd833cb4A026d050D39BED5de975f8Fe7295' as `0x${string}`,
            agentAddress: account.address,
            chainId: CHAIN_IDS[NETWORKS.ARBITRUM],
        };
        const result = await createVault(params, { notify, getProvider, sendTransactions });
        console.log('Transaction result:', result);
    } catch (error) {
        console.error('Error:', error);
    }
};
const testDepositToVault = async () => {
    try {
        const params = {
            account: account.address,
            vaultAddress: '0xCB95056E8bE266F6E661C0409385e671791CF7Fb' as `0x${string}`,
            amount0: '1',
            amount1: '0.1',
            recipient: account.address,
            chainId: CHAIN_IDS[NETWORKS.ARBITRUM],
        };
        const result = await depositToVault(params, { notify, getProvider, sendTransactions });
        console.log('Transaction result:', result);
    } catch (error) {
        console.error('Error:', error);
    }
};
const testWithdrawFromVault = async () => {
    try {
        const params = {
            account: account.address,
            vaultAddress: '0xCB95056E8bE266F6E661C0409385e671791CF7Fb' as `0x${string}`,
            shareAmount: '0.5',
            recipient: account.address,
            chainId: CHAIN_IDS[NETWORKS.ARBITRUM],
        };
        const result = await withdrawFromVault(params, { notify, getProvider, sendTransactions });
        console.log('Transaction result:', result);
    } catch (error) {
        console.error('Error:', error);
    }
};
const testRebalance = async () => {
    try {
        const params = {
            account: account.address,
            vaultAddress: '0xCB95056E8bE266F6E661C0409385e671791CF7Fb' as `0x${string}`,
            chainId: CHAIN_IDS[NETWORKS.ARBITRUM],
        };
        const result = await rebalance(params, { notify, getProvider, sendTransactions });
        console.log('Transaction result:', result);
    } catch (error) {
        console.error('Error:', error);
    }
}
const main = async () => {
    testAddLiquidity();
    testCreateVault();
    testDepositToVault();
    testWithdrawFromVault();
    testRebalance();
};

main();

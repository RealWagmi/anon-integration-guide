import { createPublicClient, createWalletClient, http, parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { addLiquidity } from '../functions/liquidity/addLiquidity';
import { TransactionReturnData } from '@heyanon/sdk';
import { NETWORKS, CHAIN_CONFIG } from '../constants';
import dotenv from 'dotenv';
import { Address } from 'viem';

dotenv.config();

const privateKey = process.env.PRIVATE_KEY;
if (!privateKey) {
    throw new Error('Private key not found in environment variables');
}

const main = async () => {
    const account = privateKeyToAccount(privateKey as `0x${string}`);

    const chain = CHAIN_CONFIG[NETWORKS.SONIC];

    const publicClient = createPublicClient({
        chain,
        transport: http('https://rpc.soniclabs.com')
    });

    const walletClient = createWalletClient({
        account,
        chain,
        transport: http('https://rpc.soniclabs.com')
    });

    const sendTransactions = async ({ transactions }) => {
        const txResults: TransactionReturnData[] = [];
        for (const tx of transactions) {
            // Use a fixed gas limit that we know is sufficient
            const gasLimit = 100000n;

            const hash = await walletClient.sendTransaction({
                chain,
                to: tx.target as Address,
                data: tx.data as `0x${string}`,
                value: params.tokenIn === '0x0000000000000000000000000000000000000000' ? parseEther('1') : 0n,
                gas: gasLimit
            });

            txResults.push({
                message: 'Transaction successful',
                hash: hash as `0x${string}`
            });
        }
        return {
            success: true,
            message: 'Transaction successful',
            data: txResults,
            isMultisig: false
        };
    };

    const notify = async (message: string) => {
        console.log(message);
    };

    const getProvider = () => {
        return publicClient;
    };

    const params = {
        chainName: NETWORKS.SONIC,
        account: account.address,
        tokenIn: '0x0000000000000000000000000000000000000000' as `0x${string}`, // S token (native)
        amount: '1',
        minOut: '0.5'
    };

    try {
        const result = await addLiquidity(params, { sendTransactions, notify, getProvider });
        console.log('Transaction successful:', result);
    } catch (error) {
        console.error('Error:', error);
    }
};

main(); 
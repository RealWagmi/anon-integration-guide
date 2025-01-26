import { Address } from "viem";
import { bsc } from "viem/chains"

import { createWalletClient, createPublicClient, http, getContract } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { ChainId } from "@heyanon/sdk";
import {vBNBAbi} from "../abis/vBNBAbi";
import {VBNB_ADDRESS} from "../constants";
import {repayToken} from "./repayToken";

// Configure the wallet client
const walletClient = createWalletClient({
    account: privateKeyToAccount(""), // Load private key from env
    chain: { id: ChainId.BSC, rpcUrls: {default:{http:["https://bsc-dataseed.binance.org/"],}}},
    transport: http(),
});

export const notify = async (message: string) => {
    console.log("Mock notify called with:", message);
};

// Implement sendTransactions
export const sendTransactions = async ({ chainId, account, transactions }: any) => {
    if (chainId !== ChainId.BSC) {
        throw new Error("Unsupported chain");
    }

    const transactionHashes = [];
    for (const tx of transactions) {
        const txHash = await walletClient.sendTransaction({
            to: tx.target,
            value: tx.value,
            data: tx.data,
        });
        transactionHashes.push({ transactionHash: txHash });
    }

    return { data: transactionHashes, isMultisig: false };
};

const publicClient = createPublicClient({
    chain: bsc,
    transport: http(),
});

const getProvider= async (chainId: number) => {
    // Create and return a publicClient for read-only operations
    return  createPublicClient({
        chain: bsc,
        transport: http(),
    })
}



const testMintToken = async () => {
    const mockChainName = "bsc";
    const mockAccount: Address = "0xA3D5b15c26D770DeaB9471228Cd6740693042190";
    const mockAmount = "0.0005";



    const result = await repayToken(
        { chainName: mockChainName, account: mockAccount, amount: mockAmount, token: "USDT", pool: "CORE" }, {sendTransactions, notify, getProvider}
    );

    console.log("Result:", result);
};

testMintToken().catch(console.error);



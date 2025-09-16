import { http, PREFUNDED_ACCOUNTS, Hex } from 'tevm';
import { FunctionOptions, TransactionReturn } from '@heyanon/sdk';
import { erc20Abi, PublicClient, Address, createTestClient, publicActions, walletActions, defineChain } from 'viem';

export async function getTestHelpers() {
    const foundrySonic = defineChain({
        id: 146,
        name: 'Sonic',
        nativeCurrency: {
            decimals: 18,
            name: 'Sonic',
            symbol: 'S',
        },
        rpcUrls: {
            default: {
                http: ['http://127.0.0.1:8545'],
                webSocket: ['ws://127.0.0.1:8545'],
            },
        },
    });

    const [account] = PREFUNDED_ACCOUNTS;

    const createNodeVm = async () => {
        const _client = createTestClient({
            chain: foundrySonic,
            mode: 'anvil',
            transport: http(),
        })
            .extend(publicActions)
            .extend(walletActions);
        return { client: _client };
    };

    // node, vm, client, walletClient
    let { client } = await createNodeVm();

    const reinit = async () => {
        await client.reset();
        const { client: _client } = await createNodeVm();
        client = _client;
    };

    const options: FunctionOptions = {
        notify: async (msg: string) => console.log('Notification:', msg),
        getProvider: (chainId: number): PublicClient => {
            if (chainId !== 146) throw new Error('Invalid chain ID');
            return client;
        },
        sendTransactions: async ({ chainId, account: _, transactions }): Promise<TransactionReturn> => {
            if (!transactions || transactions.length === 0) {
                throw new Error('No transactions provided');
            }

            const txsList = {
                data: [] as { hash: Hex; message: string }[],
                isMultisig: false,
            };

            for (let tx of transactions) {
                if (!tx.target || !tx.data) {
                    throw new Error('Invalid transaction parameters');
                }

                console.log('\nTransaction Details:');
                console.log('-------------------');
                console.log('To:', tx.target);
                console.log('Value:', (tx.value ?? 0n).toString());
                console.log('Data:', tx.data);

                try {
                    const hash = await client.sendTransaction({
                        to: tx.target,
                        value: tx.value ?? 0n,
                        data: tx.data,
                        account: account.address,
                    });
                    txsList.data.push({
                        hash,
                        message: 'Transaction submitted successfully',
                    });
                } catch (error) {
                    console.error('\nTransaction Error:');
                    console.error('----------------');
                    if (error instanceof Error) {
                        console.error('Message:', error.message);
                        console.error('Stack:', error.stack);
                    } else {
                        console.error('Unknown error:', error);
                    }
                    throw error;
                }
            }

            return txsList;
        },
    };

    const transfer = async ({ from, to, token, amount }: { token: Address; from: Address; to: Address; amount: bigint }) => {
        await client.impersonateAccount({ address: from });

        await client.writeContract({
            abi: erc20Abi,
            account: from,
            address: token,
            functionName: 'transfer',
            args: [to, amount],
            chain: foundrySonic,
        });
    };

    // client, vm, node,
    return { client, account, reinit, options, transfer };
}

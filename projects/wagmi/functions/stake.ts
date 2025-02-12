
import { Address, parseEther, encodeFunctionData, parseEventLogs, formatEther, zeroAddress, } from 'viem';
import { FunctionReturn, getChainFromName, FunctionOptions, TransactionReturn, toResult, TransactionParams, checkToApprove } from '@heyanon/sdk';
import { sWagmiAddresses, sWagmiSupportedChains } from '../constants';
import { WAGMI } from '@real-wagmi/sdk';
import { sWagmiAbi, wagmiTokenAbi } from '../abis';


interface StakeProps {
    chainName: string;
    account: Address;
    amount: string;
}

export async function stake({ chainName, account, amount }: StakeProps, tools: FunctionOptions): Promise<FunctionReturn> {
    const { getProvider, notify, sendTransactions } = tools;

    const chainId = getChainFromName(chainName);

    if (!chainId) return toResult(`Unsupported chain: ${chainName}`, true);
    if (!sWagmiSupportedChains.includes(chainId)) return toResult(`Stake unsupported chain: ${chainName}`, true);
    if (!account) return toResult('Wallet address not found', true);

    const wagmi = WAGMI[chainId];
    if (!wagmi) return toResult(`WAGMI not found on chain: ${chainName}, wallet ${account}`, true);

    const sWagmiAddress = sWagmiAddresses[chainId] as Address;
    if (!sWagmiAddress) return toResult(`sWAGMI address not found on chain: ${chainName}`, true);
    const provider = getProvider(chainId);


    const balance = await provider.readContract({
        address: wagmi.address,
        abi: wagmiTokenAbi,
        functionName: 'balanceOf',
        args: [account],
    });

    // be carefull if you work with native. You must calculate amount of native which you leave for gas.
    const amountInWei = amount === '-1' ? balance : parseEther(amount);

    if (amountInWei === 0n) return toResult(`Zero amount`, true);
    if (balance === 0n || balance < amountInWei) return toResult(`Insufficient WAGMI balance: ${balance}, wallet ${account}`, true);

    const calldata = encodeFunctionData({
        abi: sWagmiAbi,
        functionName: 'mint',
        args: [amountInWei],
    });

    const transactions: TransactionParams[] = [];

    // Check and prepare approve transaction if needed
    await checkToApprove({
        args: {
            account,
            target: wagmi.address,
            spender: sWagmiAddress,
            amount: amountInWei,
        },
        provider,
        transactions
    });

    if (transactions.length > 0) {
        await notify(`Approving ${formatEther(amountInWei)} Wagmi for stake contract by account ${account} ...`);
    }
    // Prepare stake transaction
    const tx: TransactionParams = {
        target: sWagmiAddress,
        data: calldata,
    };
    transactions.push(tx);

    const result: TransactionReturn = await sendTransactions({ chainId, account, transactions });
    const stakeData = result.data[result.data.length - 1];

    if (result.isMultisig) {
        return toResult(stakeData.message);
    }

    // Get transaction receipt and parse Transfer event
    if (!stakeData.hash) return toResult(`Staked ${formatEther(amountInWei)} WAGMI to sWAGMI on ${chainName}, but failed to receive tx hash. ${stakeData.message}`);

    const receipt = await provider.getTransactionReceipt({ hash: stakeData.hash });

    const transferEvents = parseEventLogs({
        logs: receipt.logs,
        abi: sWagmiAbi,
        eventName: 'Transfer',
    });

    const stakeEvent = transferEvents.find((log) => log.args.from === zeroAddress);
    if (!stakeEvent?.args?.value) {
        return toResult(`Staked ${formatEther(amountInWei)} WAGMI to sWAGMI on ${chainName}, but couldn't verify received sWAGMI amount. ${JSON.stringify(stakeData)}`);
    }
    const stakedAmount = formatEther(stakeEvent.args.value);
    return toResult(`Staked ${formatEther(amountInWei)} WAGMI and received ${stakedAmount} sWAGMI on ${chainName}. ${JSON.stringify(stakeData)}`);
}

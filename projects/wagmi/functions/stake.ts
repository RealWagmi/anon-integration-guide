import { getChainFromName, getViemClient } from 'libs/blockchain';
import { FunctionReturn, SystemTools } from '../../../types';
import { Address, parseEther, encodeFunctionData, formatUnits, parseEventLogs, formatEther, zeroAddress } from 'viem';
import { sWagmiAddresses, sWagmiSupportedChains } from '../constants';
import { WAGMI } from '@real-wagmi/sdk';
import { sWagmiAbi } from '../abis';
import { checkToApprove, balanceOf, extractTransactionHash } from '../../../helpers';
import { toResult } from '../../../transformers';

interface StakeProps {
    chainName: string;
    account: Address;
    amount: string;
}

export async function stake({ chainName, account, amount }: StakeProps, tools: SystemTools): Promise<FunctionReturn> {
    const { sign } = tools;

    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain: ${chainName}`, true);
    if (!sWagmiSupportedChains.includes(chainId)) return toResult(`Stake unsupported chain: ${chainName}`, true);
    if (!account) return toResult('Wallet address not found', true);

    const wagmi = WAGMI[chainId];
    if (!wagmi) return toResult(`WAGMI not found on chain: ${chainName}, wallet ${account}`, true);

    const sWagmiAddress = sWagmiAddresses[chainId] as Address;
    if (!sWagmiAddress) return toResult(`sWAGMI address not found on chain: ${chainName}`, true);

    const balance = await balanceOf(chainName, account, wagmi.address);

    // be carefull if you work with native. You must calculate amount of native which you leave for gas.
    const amountInWei = amount === '-1' ? balance : parseEther(amount);

    if (amountInWei === 0n) return toResult(`Zero amount`, true);
    if (balance === 0n || balance < amountInWei) return toResult(`Insufficient WAGMI balance: ${balance}, wallet ${account}`, true);

    const calldata = encodeFunctionData({
        abi: sWagmiAbi,
        functionName: 'mint',
        args: [amountInWei],
    });

    await checkToApprove(chainName, account, wagmi.address, sWagmiAddress, amountInWei);

    const result = await sign(chainId, account, [
        {
            target: sWagmiAddress,
            value: 0n,
            data: calldata,
        },
    ]);
    const stakeMessage = result.messages[result.messages.length - 1];
    if (result.isMultisig) {
        return toResult(stakeMessage);
    }

    // Get transaction receipt and parse Transfer event
    const txHash = extractTransactionHash(stakeMessage);
    if (!txHash) return toResult(`Staked ${formatEther(amountInWei)} WAGMI to sWAGMI on ${chainName}, but failed to receive tx hash. ${stakeMessage}`);

    const publicClient = getViemClient({ chainId });
    const receipt = await publicClient.getTransactionReceipt({ hash: txHash });

    const transferEvents = parseEventLogs({
        logs: receipt.logs,
        abi: sWagmiAbi,
        eventName: 'Transfer',
    });

    const stakeEvent = transferEvents.find((log) => log.args.from === zeroAddress);
    if (!stakeEvent?.args?.value) {
        return toResult(`Staked ${formatEther(amountInWei)} WAGMI to sWAGMI on ${chainName}, but couldn't verify received sWAGMI amount. ${stakeMessage}`);
    }
    const stakedAmount = formatUnits(stakeEvent.args.value, 18);
    return toResult(`Staked ${formatEther(amountInWei)} WAGMI and received ${stakedAmount} sWAGMI on ${chainName}. ${stakeMessage}`);
}

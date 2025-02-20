import { ChainId, checkToApprove, FunctionOptions, toResult, TransactionParams } from '@heyanon/sdk';
import { Address, encodeFunctionData, erc20Abi, formatUnits, parseUnits } from 'viem';
import { ichiVaults } from '../../constants';
import { ichiVaultAbi } from '../../abis/ichiVaultAbi';
import BigNumber from 'bignumber.js';

interface Props {
    account: Address;
    vault: Address;
    amount0: string;
    amount1: string;
}

export async function addLiquidity({ account, amount0, amount1, vault }: Props, { sendTransactions, notify, getProvider }: FunctionOptions) {
    if (!account) return toResult('Wallet not connected', true);

    await notify('Preparing to add liquidity to SwapX...');

    const vaultFound = ichiVaults.find((i) => i.vault === vault);
    if (!vaultFound) return toResult('Vault not found', true);

    const chainId = ChainId.SONIC;

    const amount0InWei = parseUnits(amount0, vaultFound.token0.decimals);
    const amount1InWei = parseUnits(amount1, vaultFound.token1.decimals);
    if (amount0InWei === 0n && amount1InWei === 0n) return toResult('At least one of the amount must be greater than 0', true);

    const token0Allowed = vaultFound.isToken0Allowed || amount0InWei == 0n;
    const token1Allowed = vaultFound.isToken1Allowed || amount1InWei == 0n;
    if (!token0Allowed || !token1Allowed) {
        let message = '';
        if (!token0Allowed) message += `(${vaultFound.token0.symbol}) `;
        if (!token1Allowed) message += `(${vaultFound.token1.symbol})`;
        message = `Vault token ${message} not allowed`;
        return toResult(message, true);
    }

    const provider = getProvider(chainId);

    // Validate max deposit
    const token0MaxDeposit = (await provider.readContract({
        address: vaultFound.vault,
        abi: ichiVaultAbi,
        functionName: 'deposit0Max',
        args: [account],
    })) as bigint;

    const token1MaxDeposit = (await provider.readContract({
        address: vaultFound.vault,
        abi: ichiVaultAbi,
        functionName: 'deposit1Max',
        args: [account],
    })) as bigint;

    if (amount0InWei > token0MaxDeposit || amount1InWei > token1MaxDeposit) {
        let message = 'Max deposit exceeded with ';
        if (amount0InWei > token0MaxDeposit) {
            const exceeded = BigInt(new BigNumber(amount0InWei.toString()).minus(token0MaxDeposit.toString()).toString());
            message += `(${formatUnits(exceeded, vaultFound.token0.decimals)} ${vaultFound.token0.symbol}) `;
        }
        if (amount1InWei > token1MaxDeposit) {
            const exceeded = BigInt(new BigNumber(amount1InWei.toString()).minus(token1MaxDeposit.toString()).toString());
            message += `(${formatUnits(exceeded, vaultFound.token1.decimals)} ${vaultFound.token1.symbol}) `;
        }
        return toResult(message, true);
    }

    // Validate token balance
    const token0Balance = await provider.readContract({
        address: vaultFound.token0.address,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [account],
    });

    const token1Balance = await provider.readContract({
        address: vaultFound.token1.address,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [account],
    });

    if (token0Balance < amount0InWei || token1Balance < amount1InWei) {
        let message = 'Insufficient token balance ';
        const symbol0 = vaultFound.token0.symbol;
        const symbol1 = vaultFound.token1.symbol;
        if (token0Balance < amount0InWei) message += `(Has ${formatUnits(token0Balance, vaultFound.token0.decimals)} ${symbol0} Needs ${amount0} ${symbol0}) `;
        if (token1Balance < amount1InWei) message += `(Has ${formatUnits(token1Balance, vaultFound.token1.decimals)} ${symbol1} Needs ${amount1} ${symbol1})`;
        return toResult(message, true);
    }

    const transactions: TransactionParams[] = [];

    // Check and prepare approve transaction if needed
    if (token0Balance > 0n) {
        await checkToApprove({
            args: {
                account,
                target: vaultFound.token0.address,
                spender: vault,
                amount: amount0InWei,
            },
            provider,
            transactions,
        });
    }

    if (token1Balance > 0n) {
        await checkToApprove({
            args: {
                account,
                target: vaultFound.token1.address,
                spender: vault,
                amount: amount1InWei,
            },
            provider,
            transactions,
        });
    }

    // Deposit token
    transactions.push({
        target: vault,
        data: encodeFunctionData({
            abi: ichiVaultAbi,
            functionName: 'deposit',
            args: [amount0InWei, amount1InWei, account],
        }),
    });

    await notify('Waiting for transaction confirmation...');

    const result = await sendTransactions({ chainId, account, transactions });
    const depositMessage = result.data[result.data.length - 1];
    const amount0Display = amount0InWei > 0 ? `${amount0} ${vaultFound.token0.symbol}` : '';
    const amount1Display = amount1InWei > 0 ? `${amount1} ${vaultFound.token1.symbol}` : '';
    const separator = amount0InWei > 0 && amount1InWei > 0 ? ' and ' : '';
    const constructedMessage = `Successfully deposited ${amount0Display}${separator}${amount1Display} to SwapX. ${depositMessage.message}`;

    return toResult(result.isMultisig ? depositMessage.message : constructedMessage);
}

import { Address, encodeFunctionData, parseUnits, erc20Abi } from 'viem';
import { FunctionReturn, FunctionOptions, toResult, EVM, EvmChain } from '@heyanon/sdk';
import { supportedChains } from '../constants';
import { getBeefyChainNameFromAnonChainName } from '../helpers/chains';
import { getSimplifiedVaultByIdAndChain } from '../helpers/vaults';
import { beefyVaultAbi } from '../abis';
import { toHumanReadableAmount } from '../helpers/format';
import { getTokenInfoFromAddress } from '../helpers/tokens';
import { TokenInfo } from '../helpers/beefyClient';

interface Props {
    chainName: string;
    account: Address;
    vaultId: string;
    amount: string;
    tokenAddress: `0x${string}`;
}

/**
 * Deposit the specified amount of tokens into a vault.  Both the token to
 * deposit and the vault contract address are determined by the vaultId.
 *
 * Docs: https://docs.beefy.finance/developer-documentation/vault-contract
 *
 * @param {Object} props - The function input parameters
 * @param {string} props.chainName - Name of the blockchain network
 * @param {Address} props.account - The user's address that will deposit tokens
 * @param {string} props.vaultId - The ID of the vault to deposit into, for example "beetsv3-sonic-beefyusdce-scusd"
 * @param {string} props.amount - The amount of tokens to deposit, in decimal format
 * @param {string} props.tokenAddress - The address of the token to deposit, starting with "0x"; used to check that the user is not trying to deposit the wrong token
 * @param {FunctionOptions} context - Holds EVM utilities and a notifier
 * @returns {Promise<FunctionReturn>} A message confirming the deposit or an error description
 */
export async function deposit(
    { chainName, account, vaultId, amount, tokenAddress }: Props,
    { evm: { sendTransactions, getProvider }, notify }: FunctionOptions,
): Promise<FunctionReturn> {
    const chainId = EVM.utils.getChainFromName(chainName as EvmChain);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Beets protocol is not supported on ${chainName}`, true);

    const provider = getProvider(chainId);

    // Fetch the vault info
    const beefyChainName = getBeefyChainNameFromAnonChainName(chainName);
    const vault = await getSimplifiedVaultByIdAndChain(vaultId, beefyChainName);
    if (!vault) return toResult(`Could not find vault with ID ${vaultId}`, true);

    // Compute the amount in wei
    const amountInWei = parseUnits(amount, vault.depositedTokenDecimals);
    if (amountInWei === 0n) return toResult('Amount must be greater than 0', true);

    // Get token address from vault contract
    // We could get it from the API (as vault.depositedTokenAddress), but
    // sometimes (e.g. native chain tokens) the API omits it
    const depositedTokenAddress = (await provider.readContract({
        address: vault.vaultContractAddress as `0x${string}`,
        abi: beefyVaultAbi,
        functionName: 'want',
    })) as `0x${string}`;
    if (!depositedTokenAddress) return toResult('Could not get token address from vault contract', true);

    let tokenInfo: TokenInfo;
    let depositedTokenInfo: TokenInfo;
    try {
        tokenInfo = await getTokenInfoFromAddress(chainName, tokenAddress);
        depositedTokenInfo = await getTokenInfoFromAddress(chainName, depositedTokenAddress);
    } catch (error) {
        return toResult('Could not get info on token to deposit', true);
    }

    // Check that the user is trying to deposit the right token
    if (tokenAddress.toLowerCase() !== depositedTokenAddress.toLowerCase()) {
        return toResult('You are trying to deposit the wrong token.  The vault wants ' + depositedTokenInfo.id + ' but you are trying to deposit ' + tokenInfo.symbol, true);
    }

    await notify(`Checking your balance of ${depositedTokenInfo.id}...`);

    // Check user balance
    let balance: bigint;
    balance = await provider.readContract({
        address: depositedTokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [account],
    });
    if (balance < amountInWei) {
        return toResult(
            `Not enough tokens: you have ${toHumanReadableAmount(balance, vault.depositedTokenDecimals)} ${vault.depositedTokenSymbol}, you need ${amount} ${vault.depositedTokenSymbol}`,
        );
    }

    // Maybe approve token to vault
    const transactions: EVM.types.TransactionParams[] = [];
    await EVM.utils.checkToApprove({
        args: { account, target: depositedTokenAddress, spender: vault.vaultContractAddress, amount: amountInWei },
        provider,
        transactions,
    });

    await notify(`Preparing to deposit ${amount} ${depositedTokenInfo.id} into vault ${vault.name}...`);

    // Prepare deposit transaction
    const tx: EVM.types.TransactionParams = {
        target: vault.vaultContractAddress as `0x${string}`,
        data: encodeFunctionData({
            abi: beefyVaultAbi,
            functionName: 'deposit',
            args: [amountInWei],
        }),
    };
    transactions.push(tx);

    if (transactions.length === 1) {
        await notify('Sending deposit transaction...');
    } else if (transactions.length > 1) {
        await notify('Sending approval & deposit transactions...');
    }

    const result = await sendTransactions({ chainId, account, transactions });
    const message = result.data[result.data.length - 1].message;
    return toResult(result.isMultisig ? message : `Successfully deposited ${amount} ${depositedTokenInfo.id}. ${message}`);
}

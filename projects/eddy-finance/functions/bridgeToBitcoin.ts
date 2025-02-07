import { Address, createPublicClient, formatUnits, getContract, http, parseUnits } from 'viem';
import { FunctionReturn, FunctionOptions, TransactionParams, toResult, getChainFromName } from '@heyanon/sdk';
import { getDataForBitcoin, supportedChains, TSS_ADDRESS, getNativeTokenName, fetchPrice, getZRC20ForNativeToken, BTC_ZRC20, MIN_TX_AMOUNT_BTC } from '../constants';
import { zrc20Abi } from '../abis/zrc20Abi';
import { zetachain } from 'viem/chains';

interface Props {
    chainName: string;
    account: Address;
    btcWallet: string;
    amount: string;
}

/**
 * Bridge native token to BTC on Bitcoin.
 * @param chainName - Source chain
 * @param account - User account address
 * @param btcWallet - Bitcoin wallet address to receive funds
 * @param amount - Amount to bridge
 * @returns Transaction result
 */
export async function bridgeToBitcoin({ chainName, account, btcWallet, amount }: Props, { sendTransactions, notify, getProvider }: FunctionOptions): Promise<FunctionReturn> {
    try {
        // Check wallet connection
        if (!account) return toResult('Wallet not connected', true);

        // Validate chain
        const chainId = getChainFromName(chainName);
        if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
        if (!supportedChains.includes(chainId)) return toResult(`Eddy Finance is not supported on ${chainName}`, true);

        // Validate amount
        const amountInWei = parseUnits(amount, 18);
        if (amountInWei === 0n) return toResult('Amount must be greater than 0', true);

        const publicClient = createPublicClient({
            chain: zetachain,
            transport: http(),
        });

        const zr20Contract = getContract({
            address: BTC_ZRC20,
            abi: zrc20Abi,
            client: publicClient,
        });

        // Get withdraw gas fee
        const res = (await zr20Contract.read.withdrawGasFee()) as [Address, bigint];

        // Destination gas fee in native token(wei). For ex in case of Ethereum, it is in ETH
        const destGasInWei = res[1];
        // Corresponding zrc20 token address for destination gas token
        const destGasZrc20 = res[0];

        // Get current price of destination gas token
        const destDollarValue = await fetchPrice(destGasZrc20);

        //BTC token decimal is 8 so divide by 10^8
        const destGas = formatUnits(destGasInWei, 8);
        // Calculate the dollar value of destination gas token
        const destDollarValueGas = Number(destGas) * destDollarValue;

        console.log('destDollarValueGas:', destDollarValueGas);

        // Check user balance
        const provider = getProvider(chainId);
        await notify('Checking user balance ⏳ ...');

        const balance = await provider.getBalance({
            address: account,
        });

        if (balance < amountInWei) {
            return toResult(`Insufficient balance.Required: ${amount} but got: ${formatUnits(balance, 18)}`, true);
        }

        // Get zrc20 token address for native token
        const srcNativeZrc20 = getZRC20ForNativeToken(chainId);

        // Get current price of source token
        const srcDollarValue = await fetchPrice(srcNativeZrc20);

        // Calculate the dollar value of source token
        // This is the amount the user is trying to bridge
        const amountDollarValue = Number(amount) * srcDollarValue;
        console.log('amountDollarValue:', amountDollarValue);
        // Check if user has enough balance to cover gas fees
        if (amountDollarValue < destDollarValueGas + MIN_TX_AMOUNT_BTC) {
            return toResult('Insufficient amount to cover destination chain gas fees. Try increasing amount', true);
        }

        await notify('Preparing to bridge to Bitcoin 🚀');

        const transactions: TransactionParams[] = [];

        // Validate Bitcoin wallet
        if (!btcWallet) {
            return toResult('Bitcoin wallet address is required', true);
        }

        // Get data for bridge
        const data: `0x${string}` = getDataForBitcoin(btcWallet) as `0x${string}`;
        console.log('data:', data);

        // TSS_ADDRESS info : https://www.zetachain.com/docs/reference/network/contracts/
        // TSS is a special address that triggers crosschain transactions
        const tx: TransactionParams = {
            target: TSS_ADDRESS, //Send funds to TSS_ADDRESS which triggers crosschain transaction
            data: data, // No encoded function as it is a simple transfer to EOA
            value: amountInWei,
        };

        transactions.push(tx);

        await notify('Waiting for transaction confirmation ⏳ ...');

        const result = await sendTransactions({ chainId, account, transactions });

        const message = result.data[result.data.length - 1];
        const nativeTokenName = getNativeTokenName(chainId);

        return toResult(result.isMultisig ? message.message : `Successfully bridged ${amount} ${nativeTokenName} to Bitcoin. ${message.message}`);
    } catch (error) {
        console.error('Bridge error:', error);
        return toResult('Failed to bridge funds to Bitcoin. Please try again.', true);
    }
}

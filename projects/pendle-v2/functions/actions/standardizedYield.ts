import { Address } from 'viem';
import { ValidationError } from '../../utils/errors';
import { standardizedYieldAbi } from '../../abis';

// Update Result type to accept Error
interface Result<T> {
  success: boolean;
  data?: T;
  error?: Error | ValidationError;
}

// Helper function to validate address
function validateAddress(address: Address): boolean {
  return typeof address === 'string' && /^0x[a-fA-F0-9]{40}$/.test(address);
}

// Core functions
export async function deposit(
  receiver: Address,
  tokenIn: Address,
  amountTokenToDeposit: string,
  minSharesOut: string,
  { getProvider, sendTransactions, notify }: { getProvider: any; sendTransactions: any; notify: any }
): Promise<Result<string>> {
  try {
    if (!validateAddress(receiver)) {
      return { success: false, error: new ValidationError('Invalid receiver address') };
    }
    if (!validateAddress(tokenIn)) {
      return { success: false, error: new ValidationError('Invalid token address') };
    }

    const provider = getProvider();
    const tx = await provider.prepareTransaction({
      functionName: 'deposit',
      args: [receiver, tokenIn, amountTokenToDeposit, minSharesOut],
      abi: standardizedYieldAbi,
    });

    const result = await sendTransactions([tx]);
    notify('Successfully deposited tokens');
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: new Error(`Failed to deposit: ${error}`) };
  }
}

export async function redeem(
  receiver: Address,
  amountSharesToRedeem: string,
  tokenOut: Address,
  minTokenOut: string,
  burnFromInternalBalance: boolean,
  { getProvider, sendTransactions, notify }: { getProvider: any; sendTransactions: any; notify: any }
): Promise<Result<string>> {
  try {
    if (!validateAddress(receiver)) {
      return { success: false, error: new ValidationError('Invalid receiver address') };
    }
    if (!validateAddress(tokenOut)) {
      return { success: false, error: new ValidationError('Invalid token address') };
    }

    const provider = getProvider();
    const tx = await provider.prepareTransaction({
      functionName: 'redeem',
      args: [receiver, amountSharesToRedeem, tokenOut, minTokenOut, burnFromInternalBalance],
      abi: standardizedYieldAbi,
    });

    const result = await sendTransactions([tx]);
    notify('Successfully redeemed tokens');
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: new Error(`Failed to redeem: ${error}`) };
  }
}

// View/Query functions
export async function getExchangeRate(
  { getProvider }: { getProvider: any }
): Promise<Result<string>> {
  try {
    const provider = getProvider();
    const result = await provider.readContract({
      functionName: 'exchangeRate',
      abi: standardizedYieldAbi,
    });
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: new Error(`Failed to get exchange rate: ${error}`) };
  }
}

export async function claimRewards(
  user: Address,
  { getProvider, sendTransactions, notify }: { getProvider: any; sendTransactions: any; notify: any }
): Promise<Result<string[]>> {
  try {
    if (!validateAddress(user)) {
      return { success: false, error: new ValidationError('Invalid user address') };
    }

    const provider = getProvider();
    const tx = await provider.prepareTransaction({
      functionName: 'claimRewards',
      args: [user],
      abi: standardizedYieldAbi,
    });

    const result = await sendTransactions([tx]);
    notify('Successfully claimed rewards');
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: new Error(`Failed to claim rewards: ${error}`) };
  }
}

export async function getAccruedRewards(
  user: Address,
  { getProvider }: { getProvider: any }
): Promise<Result<string[]>> {
  try {
    if (!validateAddress(user)) {
      return { success: false, error: new ValidationError('Invalid user address') };
    }

    const provider = getProvider();
    const result = await provider.readContract({
      functionName: 'accruedRewards',
      args: [user],
      abi: standardizedYieldAbi,
    });
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: new Error(`Failed to get accrued rewards: ${error}`) };
  }
}

export async function getRewardTokens(
  { getProvider }: { getProvider: any }
): Promise<Result<Address[]>> {
  try {
    const provider = getProvider();
    const result = await provider.readContract({
      functionName: 'getRewardTokens',
      abi: standardizedYieldAbi,
    });
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: new Error(`Failed to get reward tokens: ${error}`) };
  }
}

export async function getYieldToken(
  { getProvider }: { getProvider: any }
): Promise<Result<Address>> {
  try {
    const provider = getProvider();
    const result = await provider.readContract({
      functionName: 'yieldToken',
      abi: standardizedYieldAbi,
    });
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: new Error(`Failed to get yield token: ${error}`) };
  }
}

export async function getTokensIn(
  { getProvider }: { getProvider: any }
): Promise<Result<Address[]>> {
  try {
    const provider = getProvider();
    const result = await provider.readContract({
      functionName: 'getTokensIn',
      abi: standardizedYieldAbi,
    });
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: new Error(`Failed to get tokens in: ${error}`) };
  }
}

export async function getTokensOut(
  { getProvider }: { getProvider: any }
): Promise<Result<Address[]>> {
  try {
    const provider = getProvider();
    const result = await provider.readContract({
      functionName: 'getTokensOut',
      abi: standardizedYieldAbi,
    });
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: new Error(`Failed to get tokens out: ${error}`) };
  }
}

export async function isValidTokenIn(
  token: Address,
  { getProvider }: { getProvider: any }
): Promise<Result<boolean>> {
  try {
    if (!validateAddress(token)) {
      return { success: false, error: new ValidationError('Invalid token address') };
    }

    const provider = getProvider();
    const result = await provider.readContract({
      functionName: 'isValidTokenIn',
      args: [token],
      abi: standardizedYieldAbi,
    });
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: new Error(`Failed to check token validity: ${error}`) };
  }
}

export async function isValidTokenOut(
  token: Address,
  { getProvider }: { getProvider: any }
): Promise<Result<boolean>> {
  try {
    if (!validateAddress(token)) {
      return { success: false, error: new ValidationError('Invalid token address') };
    }

    const provider = getProvider();
    const result = await provider.readContract({
      functionName: 'isValidTokenOut',
      args: [token],
      abi: standardizedYieldAbi,
    });
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: new Error(`Failed to check token validity: ${error}`) };
  }
}

export async function previewDeposit(
  tokenIn: Address,
  amountTokenToDeposit: string,
  { getProvider }: { getProvider: any }
): Promise<Result<string>> {
  try {
    if (!validateAddress(tokenIn)) {
      return { success: false, error: new ValidationError('Invalid token address') };
    }

    const provider = getProvider();
    const result = await provider.readContract({
      functionName: 'previewDeposit',
      args: [tokenIn, amountTokenToDeposit],
      abi: standardizedYieldAbi,
    });
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: new Error(`Failed to preview deposit: ${error}`) };
  }
}

export async function previewRedeem(
  tokenOut: Address,
  amountSharesToRedeem: string,
  { getProvider }: { getProvider: any }
): Promise<Result<string>> {
  try {
    if (!validateAddress(tokenOut)) {
      return { success: false, error: new ValidationError('Invalid token address') };
    }

    const provider = getProvider();
    const result = await provider.readContract({
      functionName: 'previewRedeem',
      args: [tokenOut, amountSharesToRedeem],
      abi: standardizedYieldAbi,
    });
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: new Error(`Failed to preview redeem: ${error}`) };
  }
} 
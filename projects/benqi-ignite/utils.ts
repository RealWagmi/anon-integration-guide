import { getChainFromName } from '@heyanon/sdk';
import { Address, isAddress, parseUnits } from 'viem';
import { ALL_DURATIONS, RegisterProps, supportedChains } from './constants';

type Result<Data> =
    | {
          success: false;
          errorMessage: string;
      }
    | {
          success: true;
          data: Data;
      };

export const parseWallet = <Props extends { account: string; chainName: string }>({ account, chainName }: Props): Result<{ account: Address; chainId: number }> => {
    if (!account) return { success: false, errorMessage: 'Wallet not connected' };
    if (!isAddress(account)) return { success: false, errorMessage: 'Expected account to be a valid address' };

    const chainId = getChainFromName(chainName);

    if (!chainId) return { success: false, errorMessage: `Unsupported chain name: ${chainName}` };
    if (!supportedChains.includes(chainId)) return { success: false, errorMessage: `Protocol is not supported on ${chainName}` };

    return {
        success: true,
        data: {
            account,
            chainId,
        },
    };
};

export const parseAmount = <Props extends { amount: string; decimals: number }>({ amount, decimals }: Props): Result<bigint> => {
    if (!amount || typeof amount !== 'string') return { success: false, errorMessage: 'Amount must be a string' };

    const parsedAmount = parseUnits(amount, decimals);
    if (parsedAmount === 0n) return { success: false, errorMessage: 'Amount must be greater than 0' };

    return {
        success: true,
        data: parsedAmount,
    };
};

export const parseRegister = <Props extends RegisterProps>({ blsProofOfPossession, nodeId, validationDuration }: Props): Result<RegisterProps> => {
    if (typeof blsProofOfPossession !== 'string' || blsProofOfPossession.length !== 144) return { success: false, errorMessage: 'Invalid BLS Proof of Possession' };

    if (typeof nodeId !== 'string') return { success: false, errorMessage: 'Invalid node id' };

    if (typeof validationDuration !== 'string' || !ALL_DURATIONS.includes(validationDuration)) return { success: false, errorMessage: 'Invalid validation duration' };

    return {
        success: true,
        data: {
            blsProofOfPossession,
            nodeId,
            validationDuration,
        },
    };
};

export const parseRange = <Props extends { from: number; to: number }>(props: Props): Result<{ from: bigint; to: bigint }> => {
    const { from, to } = props;

    if (typeof from !== 'number' || typeof to !== 'number') return { success: false, errorMessage: 'Expected from and to to be numbers' };

    if (from >= to) return { success: false, errorMessage: 'Expected from to be less than to' };

    return {
        success: true,
        data: {
            from: BigInt(from),
            to: BigInt(to),
        },
    };
};

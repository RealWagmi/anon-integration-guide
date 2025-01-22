import { ChainId } from '@heyanon/sdk';
import { parseUnits } from 'viem';

export const supportedChains = [ChainId.AVALANCHE];

export const IGNITE_ADDRESS = '0x2575472517d23Ae4B9D4670F84F0c9c4eFC3876c';

export type ValidationDuration = 'TWO_WEEKS' | 'FOUR_WEEKS' | 'EIGHT_WEEKS' | 'TWELVE_WEEKS';

export const ALL_DURATIONS = ['TWO_WEEKS', 'FOUR_WEEKS', 'EIGHT_WEEKS', 'TWELVE_WEEKS'] as const;

export type RegisterProps = {
    nodeId: string;
    blsProofOfPossession: `0x${string}`;
    validationDuration: ValidationDuration;
};

export const VALIDATION_DURATION_TIME: Record<ValidationDuration, bigint> = {
    TWO_WEEKS: BigInt(86400 * 7 * 2),
    FOUR_WEEKS: BigInt(86400 * 7 * 4),
    EIGHT_WEEKS: BigInt(86400 * 7 * 8),
    TWELVE_WEEKS: BigInt(86400 * 7 * 12),
};

export const AVAX_REGISTRATION_FEE: Record<ValidationDuration, bigint> = {
    TWO_WEEKS: parseUnits('8', 18),
    FOUR_WEEKS: parseUnits('15', 18),
    EIGHT_WEEKS: parseUnits('28', 18),
    TWELVE_WEEKS: parseUnits('40', 18),
};

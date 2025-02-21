import { EVM } from '@heyanon/sdk';

const { ChainIds } = EVM.constants;

export const supportedChains = [ChainIds.sonic];

/**
 * The address of the Beets protocol's staking contract, which
 * is also the address of the stS token.
 */
export const STS_ADDRESS = '0xe5da20f15420ad15de0fa650600afc998bbe3955';

/**
 * Helper contract needed to get user withdrawals together with
 * the withdrawal ID.
 */
export const STS_HELPER_ADDRESS = '0x52b16e3d7d25ba64f242e59f9a74799ecc432d78';

/**
 * The minimum amount of Sonic tokens (S) that can be staked.
 */
export const MIN_DEPOSIT_IN_WEI = 10000000000000000n;

/**
 * The minimum amount of staked Sonic tokens (stS) that can be undelegated.
 */
export const MIN_UNDELEGATE_IN_WEI = 1000000000000n;

/**
 * The default precision used to show token amounts,
 * expressed as a number of significant digits.
 */
export const DEFAULT_PRECISION = 6;

/**
 * Maximum number of user withdrawals to show in the search
 * results, important to avoid the 500 token limit for getters.
 */
export const MAX_WITHDRAWALS_IN_RESULTS = 20;

import { FunctionReturn, toResult, FunctionOptions } from "@heyanon/sdk";

interface APRCalculationProps {
  initialStakedAmount: string; // Amount of ETH initially staked
  rewardsEarned: string; // Rewards earned in ETH
  periodInDays: number; // Duration in days over which rewards were calculated
}

export function calculateAPR(
  args: APRCalculationProps,
  options: FunctionOptions // Keeping the proper type for options
): Promise<FunctionReturn> {
  const { initialStakedAmount, rewardsEarned, periodInDays } = args;

  return new Promise((resolve) => {
    // Parse inputs
    const staked = parseFloat(initialStakedAmount);
    const rewards = parseFloat(rewardsEarned);

    // Validate inputs
    if (isNaN(staked) || staked <= 0) {
      resolve(toResult("Initial staked amount must be a positive number.", true));
      return;
    }
    if (isNaN(rewards) || rewards < 0) {
      resolve(toResult("Rewards earned must be a non-negative number.", true));
      return;
    }
    if (isNaN(periodInDays) || periodInDays <= 0) {
      resolve(toResult("Period in days must be a positive number.", true));
      return;
    }

    try {
      // Formula: APR = (Rewards Earned / Initial Staked) * (365 / Period in Days) * 100
      const apr = (rewards / staked) * (365 / periodInDays) * 100;

      // Format result to two decimal places
      resolve(toResult(`APR: ${apr.toFixed(2)}%`));
    } catch (error) {
      resolve(
        toResult(
          `Failed to calculate APR: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
          true
        )
      );
    }
  });
}

/**
 * Maximum number of orders to show in results,
 * important to avoid the 500 token limit for getters.
 */
export const MAX_ORDERS_IN_RESULTS = 25;

/**
 * Order types supported by the integration.
 */
export const ORDER_TYPES = ['market', 'limit', 'trigger', 'oco', 'trailing'] as const;

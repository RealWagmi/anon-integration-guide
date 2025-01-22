import axios from 'axios';

interface ValidatorData {
    validatorId: string;
    assetsDelegated: string;
}

const BEETS_API_URL = 'https://backend-v3.beets-ftm-node.com';

/**
 * Execute a GraphQL query and return the response as a JSON object.
 */
export async function executeGraphQLQuery<T>(query: string): Promise<T> {
    try {
        const response = await axios.post(BEETS_API_URL, { query });

        if (!response.data?.data) {
            throw new Error('Invalid response format from API');
        }

        return response.data.data as T;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            throw new Error(`GraphQL query failed: ${error.message}`);
        }
        throw new Error(`Unexpected error during GraphQL query: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Fetch the list of validators from the BEETS API.
 */
export async function fetchValidators(): Promise<ValidatorData[]> {
    const query = `
        query {
            stsGetGqlStakedSonicData {
                delegatedValidators {
                    validatorId
                    assetsDelegated
                }
            }
        }
    `;

    const response = await executeGraphQLQuery<{
        stsGetGqlStakedSonicData: {
            delegatedValidators: ValidatorData[];
        };
    }>(query);
    return response.stsGetGqlStakedSonicData.delegatedValidators;
}

/**
 * Find the validator with the highest amount of assets delegated.
 */
export function findHighestDelegatedValidator(validators: ValidatorData[]): ValidatorData {
    return validators.reduce((max, current) => (BigInt(current.assetsDelegated) > BigInt(max.assetsDelegated) ? current : max));
}

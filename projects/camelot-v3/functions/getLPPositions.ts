import { FunctionOptions, FunctionReturn, getChainFromName, toResult } from '@heyanon/sdk';
import { Address } from 'viem';
import { GRAPH_URLS, SUPPORTED_CHAINS } from '../constants';
import axios from 'axios';

interface Props {
    chainName: string;
    account: Address;
    tokenA?: Address;
    tokenB?: Address;
}

interface Position {
    id: string;
    pool: { id: string };
    token0: { id: string; name: string };
    token1: { id: string; name: string };
    tickLower: { tickIdx: number };
    tickUpper: { tickIdx: number };
    depositedToken0: string;
    depositedToken1: string;
}

interface GraphQLResponse {
    data: {
        positions: Position[];
    };
}

// TODO: Can user have more than 1000 LP positions? If so, we need to paginate the query
export async function getLPPositions({ chainName, account, tokenA, tokenB }: Props, { notify }: FunctionOptions): Promise<FunctionReturn> {
    // Check wallet connection
    if (!account) return toResult('Wallet not connected', true);

    // Validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!SUPPORTED_CHAINS.includes(chainId)) return toResult(`Camelot V3 is not supported on ${chainName}`, true);

    await notify(`Querying LP positions  on Camelot V3...`);

    // Get LP positions
    const positions = await queryLPPositions(chainId, account, tokenA, tokenB);

    if (!positions.length) return toResult('No LP positions found', true);

    // TODO: print out the positions to TG?

    return toResult('Successfully queried LP positions', false);
}

export async function queryLPPositions(chainId: number, account: Address, tokenA?: Address, tokenB?: Address) {
    const apiUrl = GRAPH_URLS[chainId];

    let tokenConditions = '';
    if (tokenA && !tokenB) {
        tokenConditions = `
            {
                or: [
                    { token0: "${tokenA.toLowerCase()}" },
                    { token1: "${tokenA.toLowerCase()}" }
                ]
            }
        `;
    } else if (!tokenA && tokenB) {
        tokenConditions = `
            {
                or: [
                    { token0: "${tokenB.toLowerCase()}" },
                    { token1: "${tokenB.toLowerCase()}" }
                ]
            }
        `;
    } else if (!tokenA && !tokenB) {
        tokenConditions = `
            {
                or: [
                    {
                        and: [
                            { token0: "${tokenA!.toLowerCase()}" },
                            { token1: "${tokenB!.toLowerCase()}" }
                        ]
                    },
                    {
                        and: [
                            { token0: "${tokenB!.toLowerCase()}" },
                            { token1: "${tokenA!.toLowerCase()}" }
                        ]
                    }
                ]
            }
        `;
    }

    const query = `
        {
            positions(
                where: {
                    and: [
                        { owner: "${account.toLowerCase()}" },
                        { liquidity_gt: 0 },
                        ${tokenConditions}
                    ]
                }
            ) {
                id
                pool {
                  id
                }
                token0 {
                    id
                    name
                }
                token1 {
                    id
                    name
                }
                tickLower {
                  tickIdx
                }
                tickUpper {
                  tickIdx
                }
                depositedToken0
                depositedToken1
            }
        }
    `;

    const positions = await axios.post<GraphQLResponse>(apiUrl, { query });
    return positions.data.data.positions;
}

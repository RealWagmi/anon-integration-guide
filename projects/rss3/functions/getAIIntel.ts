import { type FunctionReturn, toResult } from '@heyanon/sdk';
import { rss3AIEndpoint } from '../constants';

interface AIIntel {
    agent_insight: string;
    knowledge_corpus: string;
    intel_digest: string;
}

interface Props {
    limit?: number;
}

/**
 * Fetch the latest news to be consumed by AI agents for analysis and decision-making
 * @param props - The function parameters
 * @returns The list of latest news
 */
export async function getAIIntel({ limit = 10 }: Props): Promise<FunctionReturn> {
    let url = `${rss3AIEndpoint}/ai_intel`;

    if (limit) {
        url += `?limit=${limit}`;
    }

    let data: AIIntel[];

    try {
        data = await (await fetch(url)).json();
    } catch (error) {
        return toResult(JSON.stringify(error), true);
    }

    return toResult(JSON.stringify(data), false);
}

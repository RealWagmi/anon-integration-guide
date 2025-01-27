import axios from 'axios';
import { GameAgent, GameWorker, ExecutableGameFunctionResponse, ExecutableGameFunctionStatus, GameFunction } from '@virtuals-protocol/game';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { CMC_API_KEY, CMC_API_URL, GEMINI_API_KEY, VIRTUALS_API_KEY } from '../constants';

let result = '';
let price_data = '';
// let news_data = ''; TODO: FIXME

const getTokenPriceDataFunction = new GameFunction({
    name: 'get_token_price_data',
    description: 'Fetch the price of a crypto token then return human readable report',
    args: [
        {
            name: 'token_symbol',
            description: 'Symbol of the token that is extracted from the prompt',
        },
    ] as const,
    executable: async (args, logger) => {
        try {
            let response = await axios.get(
                `${CMC_API_URL}/cryptocurrency/quotes/latest?symbol=${args.token_symbol}&aux=num_market_pairs,cmc_rank,date_added,tags,platform,max_supply,circulating_supply,total_supply,market_cap_by_total_supply,volume_24h_reported,volume_7d,volume_7d_reported,volume_30d,volume_30d_reported,is_active,is_fiat`,
                {
                    headers: {
                        'X-CMC_PRO_API_KEY': CMC_API_KEY,
                    },
                },
            );
            if (!response || response.status != 200) {
                throw new Error('INVALID_CMC_RESPONSE');
            }
            const {
                data: { data },
            } = response;
            result = JSON.stringify(data);
            price_data = result;
            return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Done, result);
        } catch (e) {
            result = `Failed to get token ${args.token_symbol} price`;
            return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Failed, result);
        }
    },
});

// TODO: FIXME - It's not provided in CMC basic plan
// const getTokenNewsFunction = new GameFunction({
//     name: 'get_token_news',
//     description: 'Fetch the news about a token',
//     args: [
//         {
//             name: 'token_symbol',
//             description: 'Symbol of the token that is extracted from the prompt',
//         },
//     ] as const,
//     executable: async (args, logger) => {
//         try {
//             let response = await axios.get(`${CMC_API_URL}/content/latest?symbol=${args.token_symbol}&limit=1&news_type=news&content_type=news`, {
//                 headers: {
//                     'X-CMC_PRO_API_KEY': CMC_API_KEY,
//                 },
//             });
//             if (!response || response.status != 200) {
//                 throw new Error('INVALID_CMC_RESPONSE');
//             }
//             const {
//                 data: { data },
//             } = response;
//             result = JSON.stringify(data);
//             news_data = result;
//             return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Done, result);
//         } catch (e: any) {
//             logger(e.toString());
//             result = `Failed to get token ${args.token_symbol} news`;
//             return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Failed, result);
//         }
//     },
// });

const analyzeTokenPriceFunction = new GameFunction({
    name: 'analyze_token_price',
    description: "It gets some information like price from function get_token_price_data and some news, then analyzes and predicts a token's price",
    args: [
        {
            name: 'token_symbol',
            description: 'Symbol of the token that is extracted from the prompt',
        },
        {
            name: 'token_news',
            description: "Token news if it's provided",
        },
    ] as const,
    executable: async (args, logger) => {
        try {
            const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

            const model = genAI.getGenerativeModel({
                model: 'gemini-1.5-flash',
                systemInstruction: 'You should analyze and predict a crypto token price based on the information that you provided. Your response should just be a text',
            });

            let gptResponse = await model.generateContent({
                contents: [
                    {
                        role: 'user',
                        parts: [
                            {
                                text: `Analyze and predict the price of token ${args.token_symbol} based on the information ${price_data} ${
                                    args.token_news != 'None' ? 'and news: ' + args.token_news : ''
                                }`,
                            },
                        ],
                    },
                ],
            });

            if (!gptResponse) {
                throw new Error('INVALID_GPT_RESPONSE');
            }
            result = gptResponse.response.text();
            return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Done, result);
        } catch (e: any) {
            logger(e.toString());
            result = `Failed to analyze token ${args.token_symbol} price`;
            return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Failed, result);
        }
    },
});

const extractPriceFunction = new GameFunction({
    name: 'extract_price',
    description: 'Extract the price of a token from price_data',
    args: [
        {
            name: 'token_symbol',
            description: 'Symbol of the token that is extracted from the prompt',
        },
        {
            name: 'price',
            description: 'Token price',
        },
    ] as const,
    executable: async (args, logger) => {
        try {
            result = args.price!.toString();
            return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Done, result);
        } catch (e) {
            result = `Unable to extract price of token ${args.token_symbol}`;
            return new ExecutableGameFunctionResponse(ExecutableGameFunctionStatus.Failed, result);
        }
    },
});

const worker = new GameWorker({
    id: 'main_worker',
    name: 'Main worker of the agent',
    description: 'A multi-purpose crypto worker that have some general crypto related functionalities. it aims to do a task based on the user instructions',
    functions: [
        getTokenPriceDataFunction,
        // getTokenNewsFunction, TODO: FIXME
        analyzeTokenPriceFunction,
        extractPriceFunction,
    ],
    // Optional: Provide environment to LLP
    getEnvironment: async () => {
        return {};
    },
});

const agent = new GameAgent(VIRTUALS_API_KEY, {
    name: 'Crypto assistant Bot',
    goal: 'Get instruction from user according to crypto market and respond properly',
    description: 'A crypto multi-purpose bot that receives an instruction from the user and use its functions to do the task',
    workers: [worker],
    getAgentState: async () => {
        return {};
    },
});

interface Props {
    prompt: string;
}

/**
 * A function that lets user to interact with Virtuals crypto AI agent and talk to it, then it runs Virtuals crypto agent and process the user's instruction.
 * @param prompt - The prompt of user that contains crypto price instruction.
 * @returns Transaction result
 * @dev Example prompt: "Please analyze ZRO short term price. last piece of news: A key part of USDT0's architecture is its use of the LayerZero omnichannel fungible token (OFT) standard, known for enabling secure, cost-efficient asset transfers across multiple chains. According to the firm, this setup boosts transaction speeds while keeping fees affordable and security protocols intact."
 */
export async function interactCryptoAgent({ prompt }: Props, { notify }: FunctionOptions): Promise<FunctionReturn> {
    await notify('Preparing response...');

    await agent.init();

    const agentWorker = agent.getWorkerById(worker.id);

    await agentWorker.runTask(prompt, {
        /**
         * @property {boolean} verbose - A flag to enable or disable verbose logging.
         *
         * @description
         * The `verbose` property is used to control the verbosity of the logging output.
         * When set to `true`, detailed logs will be generated, which can be useful for
         * debugging and development purposes. When set to `false`, only essential logs
         * will be produced, reducing the amount of log output.
         */
        verbose: true || false,
    });

    return toResult(result);
}

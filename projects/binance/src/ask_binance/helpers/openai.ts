import { AiTool } from '@heyanon/sdk';
import OpenAI from 'openai';

/**
 * Convert a HeyAnon tools to an OpenAI tool.
 *
 * Example of an OpenAI tool from https://platform.openai.com/docs/guides/function-calling:
 *
 * {
 *    "type": "function",
 *    "function": {
 *        "name": "get_weather",
 *        "description": "Retrieves current weather for the given location.",
 *        "parameters": {
 *            "type": "object",
 *            "properties": {
 *                "location": {
 *                    "type": "string",
 *                    "description": "City and country e.g. Bogotá, Colombia"
 *                },
 *                "units": {
 *                    "type": "string",
 *                    "enum": [
 *                        "celsius",
 *                        "fahrenheit"
 *                    ],
 *                    "description": "Units the temperature will be returned in."
 *                }
 *            },
 *            "required": [
 *                "location",
 *                "units"
 *            ],
 *            "additionalProperties": false
 *        },
 *        "strict": true
 *    }
 *}
 */
export function fromHeyAnonToolsToOpenAiTools(tool: AiTool): OpenAI.Chat.Completions.ChatCompletionTool {
    return {
        type: 'function',
        function: {
            name: tool.name,
            description: tool.description,
            parameters: {
                type: 'object',
                properties: Object.fromEntries(
                    tool.props.map((prop) => {
                        // Case of a nested property, e.g. the search knowledge example from
                        // https://platform.openai.com/docs/guides/function-calling
                        if (prop.type === 'object' || (Array.isArray(prop.type) && prop.type.includes('object'))) {
                            return [
                                prop.name,
                                {
                                    type: prop.type,
                                    enum: prop.enum,
                                    description: prop.description,
                                    properties: prop.properties, // nested properties
                                    required: prop.required, // all properties are required
                                    additionalProperties: false, // required by API
                                },
                            ];
                        } else {
                            return [
                                prop.name,
                                {
                                    type: prop.type,
                                    enum: prop.enum,
                                    description: prop.description,
                                },
                            ];
                        }
                    }),
                ),
                required: tool.required,
                additionalProperties: false,
            },
            strict: true,
        },
    };
}

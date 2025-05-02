import { AiTool } from '@heyanon/sdk';
import OpenAI from 'openai';

/**
 * Convert a HeyAnon tools to an OpenAI tool, with support for nested properties.
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
                properties: Object.fromEntries(tool.props.map((prop) => [prop.name, processProperty(prop)])),
                required: tool.required,
                additionalProperties: false,
            },
            strict: true,
        },
    };
}

/**
 * Recursively process a property and its nested properties
 */
function processProperty(prop: any): any {
    // Case of a nested property (object type)
    if (prop.type === 'object' || (Array.isArray(prop.type) && prop.type.includes('object'))) {
        const result: any = {
            type: prop.type,
            description: prop.description,
            additionalProperties: false,
        };

        // Add enum if present
        if (prop.enum) {
            result.enum = prop.enum;
        }

        // Process nested properties recursively
        if (prop.properties) {
            result.properties = Object.fromEntries(Object.entries(prop.properties).map(([name, nestedProp]: [string, any]) => [name, processProperty({ ...nestedProp, name })]));
        }

        // Add required fields if present
        if (prop.required) {
            result.required = prop.required;
        }

        return result;
    } else {
        // Simple property
        const result: any = {
            type: prop.type,
            description: prop.description,
        };

        // Add enum if present
        if (prop.enum) {
            result.enum = prop.enum;
        }

        return result;
    }
}

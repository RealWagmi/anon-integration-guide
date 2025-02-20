import { EVM } from '@heyanon/sdk';

// Validation helpers
const isValidAmount = (amount: string): boolean => {
    const num = parseFloat(amount);
    return num > 0 && num < 1000000; // Reasonable limits
};

const isValidLeverage = (leverage: string): boolean => {
    return ['2', '5', '10', '15', '25'].includes(leverage);
};

const isValidSlippage = (slippage: string): boolean => {
    const num = parseFloat(slippage);
    return num > 0 && num <= 5; // Max 5% slippage
};

export interface Tool {
    name: string;
    description: string;
    keywords: string[];
    example: string;
    extractArgs: (question: string) => Record<string, string> | null;
    generateResponse: (args: Record<string, string>) => string;
    validateArgs?: (args: Record<string, string>) => string | null; // Optional validation function
}

export const tools: Tool[] = [
    {
        name: 'mintUnit',
        description: 'mint UNIT tokens with rETH',
        keywords: ['mint unit', 'mint units', 'deposit reth', 'get unit', 'create unit'],
        example: 'Try asking: "Mint UNIT tokens with 1 rETH" or "Deposit 0.5 rETH to get UNIT"',
        extractArgs: (question: string) => {
            const amountMatch = question.match(/(\d*\.?\d+)\s*(?:reth|rETH)/i);
            if (!amountMatch) return null;

            const slippageMatch = question.match(/(\d*\.?\d+)%?\s*slippage/i);
            return {
                rethAmount: amountMatch[1],
                slippageTolerance: slippageMatch ? slippageMatch[1] : '0.25'
            };
        },
        validateArgs: (args) => {
            if (!isValidAmount(args.rethAmount)) {
                return `Invalid rETH amount: ${args.rethAmount}. Please use a positive amount less than 1,000,000 rETH.`;
            }
            if (!isValidSlippage(args.slippageTolerance)) {
                return `Invalid slippage: ${args.slippageTolerance}%. Please use a value between 0.01% and 5%.`;
            }
            return null;
        },
        generateResponse: (args) => {
            return `I'll help you mint UNIT tokens with ${args.rethAmount} rETH using ${args.slippageTolerance}% slippage tolerance.`;
        }
    },
    {
        name: 'redeemUnit',
        description: 'redeem UNIT tokens for rETH',
        keywords: ['redeem unit', 'redeem units', 'withdraw unit', 'withdraw units', 'convert unit', 'convert units'],
        example: 'Try asking: "Redeem 100 UNIT tokens" or "Withdraw 50 UNIT with minimum 0.1 rETH"',
        extractArgs: (question: string) => {
            const amountMatch = question.match(/(\d*\.?\d+)\s*(?:unit|UNIT)/i);
            const minOutMatch = question.match(/(?:minimum|min|at least)\s*(\d*\.?\d+)\s*(?:reth|rETH)/i);
            if (!amountMatch) return null;

            return {
                unitAmount: amountMatch[1],
                minAmountOut: minOutMatch ? minOutMatch[1] : '0'
            };
        },
        validateArgs: (args) => {
            if (!isValidAmount(args.unitAmount)) {
                return `Invalid UNIT amount: ${args.unitAmount}. Please use a positive amount less than 1,000,000 UNIT.`;
            }
            if (args.minAmountOut !== '0' && !isValidAmount(args.minAmountOut)) {
                return `Invalid minimum rETH amount: ${args.minAmountOut}. Please use a positive amount less than 1,000,000 rETH.`;
            }
            return null;
        },
        generateResponse: (args) => {
            return `I'll help you redeem ${args.unitAmount} UNIT tokens${args.minAmountOut !== '0' ? ` with minimum ${args.minAmountOut} rETH output` : ''}.`;
        }
    },
    {
        name: 'openLongPosition',
        description: 'open a leveraged long position',
        keywords: ['open position', 'long position', 'leverage', 'leveraged', 'create position', 'start position', 'new position'],
        example: 'Try asking: "Open a 5x leveraged position with 2 rETH" or "Create 10x long with 1 rETH"',
        extractArgs: (question: string) => {
            const leverageMatch = question.match(/(\d+)x/i);
            const amountMatch = question.match(/(\d*\.?\d+)\s*(?:reth|rETH)/i);
            if (!leverageMatch || !amountMatch) return null;

            return {
                marginAmount: amountMatch[1],
                leverage: leverageMatch[1]
            };
        },
        validateArgs: (args) => {
            if (!isValidAmount(args.marginAmount)) {
                return `Invalid margin amount: ${args.marginAmount} rETH. Please use a positive amount less than 1,000,000 rETH.`;
            }
            if (!isValidLeverage(args.leverage)) {
                return `Invalid leverage: ${args.leverage}x. Supported values are: 2x, 5x, 10x, 15x, and 25x.`;
            }
            return null;
        },
        generateResponse: (args) => {
            return `I'll help you open a ${args.leverage}x leveraged long position with ${args.marginAmount} rETH as margin.`;
        }
    },
    {
        name: 'addCollateral',
        description: 'add collateral to an existing position',
        keywords: ['add collateral', 'increase margin', 'add margin', 'more collateral', 'boost position'],
        example: 'Try asking: "Add 0.5 rETH collateral to position #123" or "Increase margin of position 456 by 1 rETH"',
        extractArgs: (question: string) => {
            const positionMatch = question.match(/(?:position|pos\.?|#)\s*(\d+)/i);
            const amountMatch = question.match(/(\d*\.?\d+)\s*(?:reth|rETH)/i);
            if (!positionMatch || !amountMatch) return null;

            return {
                positionId: positionMatch[1],
                additionalCollateral: amountMatch[1]
            };
        },
        validateArgs: (args) => {
            if (!isValidAmount(args.additionalCollateral)) {
                return `Invalid collateral amount: ${args.additionalCollateral} rETH. Please use a positive amount less than 1,000,000 rETH.`;
            }
            return null;
        },
        generateResponse: (args) => {
            return `I'll help you add ${args.additionalCollateral} rETH collateral to position #${args.positionId}.`;
        }
    },
    {
        name: 'closePosition',
        description: 'close an existing leveraged position',
        keywords: ['close position', 'exit position', 'end position', 'close trade', 'exit trade'],
        example: 'Try asking: "Close position #123" or "Exit position 456 with minimum price 1800"',
        extractArgs: (question: string) => {
            const positionMatch = question.match(/(?:position|pos\.?|#|trade)\s*(\d+)/i);
            const priceMatch = question.match(/(?:price|fill|@|at)\s*(\d*\.?\d+)/i);
            if (!positionMatch) return null;

            return {
                positionId: positionMatch[1],
                minFillPrice: priceMatch ? priceMatch[1] : '0'
            };
        },
        validateArgs: (args) => {
            if (args.minFillPrice !== '0' && !isValidAmount(args.minFillPrice)) {
                return `Invalid minimum fill price: ${args.minFillPrice}. Please use a positive amount less than 1,000,000.`;
            }
            return null;
        },
        generateResponse: (args) => {
            return `I'll help you close position #${args.positionId}${args.minFillPrice !== '0' ? ` with minimum fill price of ${args.minFillPrice}` : ''}.`;
        }
    }
]; 
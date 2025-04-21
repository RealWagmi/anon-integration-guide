// import * as ccxt from 'ccxt';
// import chalk from 'chalk';
// import { getExchangeConfig } from '../config/keys';

// interface ExchangeConfig {
//   apiKey: string;
//   secret: string;
// }

// /**
//  * Given an exchange name, create and return an exchange
//  * instance with API keys
//  */
// export function getExchangeWithAPI(exchangeId: string): ccxt.Exchange {
//   if (!isExchangeSupported(exchangeId.toLowerCase())) {
//     throw new Error(`Exchange ${exchangeId.toLowerCase()} is not supported by CCXT.`);
//   }

//   const config = getExchangeConfig(exchangeId.toLowerCase()) as ExchangeConfig;
//   if (!config) {
//     throw new Error(
//       `No API keys found for ${exchangeId.toLowerCase()}. Run 'ccxt-cli config add ${exchangeId.toLowerCase()}' first.`
//     );
//   }

//   // Use dynamic instantiation pattern
//   const exchange = new (ccxt as any)[exchangeId.toLowerCase()]({
//     apiKey: config.apiKey,
//     secret: config.secret,
//     enableRateLimit: true
//   });

//   return exchange;
// }

// /**
//  * Given an exchange name, create and return an exchange instance
//  * without API keys, to be used to query public endpoints
//  */
// export function getExchange(exchangeId: string): ccxt.Exchange {
//   try {
//     const exchange = new (ccxt as any)[exchangeId.toLowerCase()]({
//       enableRateLimit: true
//     });
//     return exchange;
//   } catch (error) {
//     throw new Error(`Exchange ${exchangeId} is not supported by CCXT.`);
//   }
// }

// /**
//  * Given an exchange name, return true if the exchange is supported by CCXT
//  */
// export function isExchangeSupported(exchangeId: string): boolean {
//   try {
//     const exchange = new (ccxt as any)[exchangeId.toLowerCase()]({
//       enableRateLimit: true
//     });
//     return true;
//   } catch (error) {
//     return false;
//   }
// }

// /**
//  * Check if a currency requires additional steps for operations
//  */
// export async function checkCurrencyRequirements(
//   exchange: ccxt.Exchange, 
//   currency: string, 
//   operation: 'deposit' | 'withdraw'
// ) {
//   try {
//     const currencies = await exchange.fetchCurrencies();
//     const currencyInfo = currencies[currency.toUpperCase()];
    
//     if (!currencyInfo) {
//       console.log(chalk.yellow(`Warning: Currency ${currency} information not available.`));
//       return;
//     }
    
//     // Check if withdrawal is disabled
//     if (operation === 'withdraw' && 
//         currencyInfo.withdraw === false || 
//         (currencyInfo as any).withdrawal?.disabled) {
//       throw new Error(`Withdrawals for ${currency} are currently disabled on ${exchange.id}.`);
//     }
    
//     // Check if deposit is disabled
//     if (operation === 'deposit' && 
//         currencyInfo.deposit === false || 
//         (currencyInfo as any).deposit?.disabled) {
//       throw new Error(`Deposits for ${currency} are currently disabled on ${exchange.id}.`);
//     }
    
//     // Show warning about address whitelisting if applicable
//     if (operation === 'withdraw') {
//       console.log(chalk.yellow(`NOTE: ${exchange.id} may require address whitelisting on their website before withdrawal.`));
//     }
    
//   } catch (error) {
//     // If fetchCurrencies is not available, just show a generic warning
//     console.log(chalk.yellow(`NOTE: ${exchange.id} may require additional setup on their website for ${operation} operations.`));
//   }
// } 
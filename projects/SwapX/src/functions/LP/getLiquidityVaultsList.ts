import { FunctionReturn, toResult } from '@heyanon/sdk';
import { ichiVaults } from '../../constants';

export async function getLiquidityVaultsList(): Promise<FunctionReturn> {
    let message = 'Swap X LP vaults:\n';
    let num = 1;
    for (let vault of ichiVaults) {
        message += `${num++}. ${vault.title}: (${vault.isToken0Allowed ? vault.token0.symbol : ''}${vault.isToken0Allowed && vault.isToken1Allowed ? ',' : ''}${
            vault.isToken1Allowed ? vault.token1.symbol : ''
        })\n`;
    }

    return toResult(message);
}

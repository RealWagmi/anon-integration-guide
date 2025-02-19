import { formatUnits, parseUnits } from 'viem';
import { describe, expect, it, vi } from 'vitest';
import comptrollerAbi from '../abis/comptroller';
import { CORE_COMPTROLLER_ADDRESS, ECOSYSTEM_UNITROLLER_ADDRESS, LIQUIDITY_DECIMALS } from '../constants';
import { getAccountLiquidity } from './getAccountLiquidity';

vi.mock('@heyanon/sdk');

describe('getAccountLiquidity', () => {
    it('should return user liquidity and shortfall on core market', async () => {
        const props: Parameters<typeof getAccountLiquidity>[0] = {
            account: '0x1234567890123456789012345678901234567890',
            chainName: 'Avalanche',
            marketType: 'core',
        };

        const response = [0, parseUnits('10', LIQUIDITY_DECIMALS), 0n] as const;

        const provider = {
            readContract: vi.fn().mockReturnValue(Promise.resolve(response)),
        };

        const tools: Parameters<typeof getAccountLiquidity>[1] = {
            sendTransactions: vi.fn(),
            notify: vi.fn(),
            getProvider: vi.fn().mockReturnValue(provider),
        };

        const result = await getAccountLiquidity(props, tools);

        expect(provider.readContract).toHaveBeenCalledWith(
            expect.objectContaining({
                abi: comptrollerAbi,
                address: CORE_COMPTROLLER_ADDRESS,
                functionName: 'getAccountLiquidity',
                args: [props.account],
            }),
        );
        expect(result.data).toMatch(`Account liquidity: ${formatUnits(response[1], LIQUIDITY_DECIMALS)}`);
        expect(result.data).toMatch(`Shortfall: ${formatUnits(response[2], LIQUIDITY_DECIMALS)}`);
    });

    it('should return error code from contract call', async () => {
        const props: Parameters<typeof getAccountLiquidity>[0] = {
            account: '0x1234567890123456789012345678901234567890',
            chainName: 'Avalanche',
            marketType: 'core',
        };

        const response = [10, 0n, 0n] as const;

        const provider = {
            readContract: vi.fn().mockReturnValue(Promise.resolve(response)),
        };

        const tools: Parameters<typeof getAccountLiquidity>[1] = {
            sendTransactions: vi.fn(),
            notify: vi.fn(),
            getProvider: vi.fn().mockReturnValue(provider),
        };

        const result = await getAccountLiquidity(props, tools);

        expect(provider.readContract).toHaveBeenCalledWith(
            expect.objectContaining({
                abi: comptrollerAbi,
                address: CORE_COMPTROLLER_ADDRESS,
                functionName: 'getAccountLiquidity',
                args: [props.account],
            }),
        );
        expect(result.success).toBeFalsy();
        expect(result.data).toMatch(`Error code ${response[0]}`);
    });

    it('should return user liquidity and shortfall on ecosystem market', async () => {
        const props: Parameters<typeof getAccountLiquidity>[0] = {
            account: '0x1234567890123456789012345678901234567890',
            chainName: 'Avalanche',
            marketType: 'ecosystem',
        };

        const response = [0, parseUnits('10', LIQUIDITY_DECIMALS), 0n] as const;

        const provider = {
            readContract: vi.fn().mockReturnValue(Promise.resolve(response)),
        };

        const tools: Parameters<typeof getAccountLiquidity>[1] = {
            sendTransactions: vi.fn(),
            notify: vi.fn(),
            getProvider: vi.fn().mockReturnValue(provider),
        };

        const result = await getAccountLiquidity(props, tools);

        expect(provider.readContract).toHaveBeenCalledWith(
            expect.objectContaining({
                abi: comptrollerAbi,
                address: ECOSYSTEM_UNITROLLER_ADDRESS,
                functionName: 'getAccountLiquidity',
                args: [props.account],
            }),
        );
        expect(result.data).toMatch(`Account liquidity: ${formatUnits(response[1], LIQUIDITY_DECIMALS)}`);
        expect(result.data).toMatch(`Shortfall: ${formatUnits(response[2], LIQUIDITY_DECIMALS)}`);
    });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { depositIntoVault } from '../depositIntoVault';
import { toResult } from '@heyanon/sdk';
import { Address } from 'viem';

vi.mock('axios', () => ({
  default: {
    post: vi.fn(),
  },
}));

vi.mock('viem/accounts', () => ({
  generatePrivateKey: vi.fn(() => 'dummy-private-key'),
  privateKeyToAccount: vi.fn(() => ({
    address: '0xAgentWalletAddress',
  })),
}));

vi.mock('../utils/_signL1Action', () => ({
  _signL1Action: vi.fn(() => Promise.resolve('signed-action')),
}));

vi.mock('../utils/_getVaultAddress', () => ({
  _getVaultAddress: vi.fn(async () => '0xResolvedVaultAddress'),
}));

import axios from 'axios';
import { _getVaultAddress } from '../utils/_getVaultAddress';

const mockedAxios = axios as unknown as { post: ReturnType<typeof vi.fn> };

const defaultProps = {
  account: '0xabc123abc123abc123abc123abc123abc123abcd' as Address,
  vault: '0xResolvedVaultAddress',
  usd: 50,
};


const signTypedDatas = vi.fn().mockResolvedValue([
    '0x9f8f577823132326a0b55dea300f5b2427f3affe5b9c11eeef1ebf969238038b56bf4176fd974312f8d074eb4a5250480c088897c416098decf89a0ceaaf7cc51c',
] as `0x${string}`[]);

const functionOptions = {
  evm: {
    signTypedDatas,
  },
};

describe('depositIntoVault', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should deposit successfully into vault', async () => {
    mockedAxios.post
      .mockResolvedValueOnce({ data: { withdrawable: 1000 } }) // clearinghouse state
      .mockResolvedValueOnce({ data: { status: 'ok' } })       // approveAgent
      .mockResolvedValueOnce({
        data: {
          status: 'ok',
          response: { data: { statuses: [{}] } },
        },
      }); // vaultTransfer

    const result = await depositIntoVault(defaultProps, functionOptions as any);
    expect(result.success).toBe(true);
    expect(result.data).toContain('Successfully deposited into vault');
  });

  it('should resolve vault name into address', async () => {
    (_getVaultAddress as any).mockResolvedValueOnce('0xResolvedVaultAddress');

    mockedAxios.post
      .mockResolvedValueOnce({ data: { withdrawable: 100 } })
      .mockResolvedValueOnce({ data: { status: 'ok' } })
      .mockResolvedValueOnce({
        data: {
          status: 'ok',
          response: { data: { statuses: [{}] } },
        },
      });

    const result = await depositIntoVault(
      { ...defaultProps, vault: 'MyVault' },
      functionOptions as any,
    );

    expect(result.success).toBe(true);
    expect(_getVaultAddress).toHaveBeenCalled();
  });

  it('should return error if vault resolution fails', async () => {
    (_getVaultAddress as any).mockResolvedValueOnce(null);

    const result = await depositIntoVault(
      { ...defaultProps, vault: 'BadVaultName' },
      functionOptions as any,
    );

    expect(result).toEqual(toResult('Invalid vault specified', true));
  });

  it('should return error if deposit amount is less than 10', async () => {
    const result = await depositIntoVault(
      { ...defaultProps, usd: 5 },
      functionOptions as any,
    );

    expect(result).toEqual(toResult('Minimum deposit value is 10$', true));
  });

  it('should return error if deposit exceeds withdrawable', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: { withdrawable: 30 } });

    const result = await depositIntoVault(
      { ...defaultProps, usd: 100 },
      functionOptions as any,
    );

    expect(result).toEqual(toResult('Your balance is 30$', true));
  });

  it('should return error if signTypedDatas is not available', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: { withdrawable: 100 } });

    const result = await depositIntoVault(defaultProps, {
      evm: {},
    } as any);

    expect(result.success).toBe(false);
    expect(result.data).toContain('Failed to deposit into vault on Hyperliquid');
  });

  it('should return error if approveAgent post fails', async () => {
    mockedAxios.post
      .mockResolvedValueOnce({ data: { withdrawable: 100 } })
      .mockRejectedValueOnce(new Error('approveAgent failed'));

    const result = await depositIntoVault(defaultProps, functionOptions as any);

    expect(result.success).toBe(false);
    expect(result.data).toContain('Failed to deposit into vault on Hyperliquid');
  });

  it('should return error if vaultTransfer returns status=err', async () => {
    mockedAxios.post
      .mockResolvedValueOnce({ data: { withdrawable: 100 } })
      .mockResolvedValueOnce({ data: { status: 'ok' } })
      .mockResolvedValueOnce({ data: { status: 'err', response: 'vaultTransfer error' } });

    const result = await depositIntoVault(defaultProps, functionOptions as any);

    expect(result.success).toBe(false);
    expect(result.data).toContain('Failed to deposit into vault on Hyperliquid');
  });

  it('should return error if vaultTransfer response contains error in statuses', async () => {
    mockedAxios.post
      .mockResolvedValueOnce({ data: { withdrawable: 100 } })
      .mockResolvedValueOnce({ data: { status: 'ok' } })
      .mockResolvedValueOnce({
        data: {
          status: 'ok',
          response: { data: { statuses: [{ error: 'rejected' }] } },
        },
      });

    const result = await depositIntoVault(defaultProps, functionOptions as any);

    expect(result.success).toBe(false);
    expect(result.data).toContain('Failed to deposit into vault on Hyperliquid');
  });

  it('should handle unexpected exceptions', async () => {
    mockedAxios.post.mockRejectedValueOnce(new Error('Network error'));

    const result = await depositIntoVault(defaultProps, functionOptions as any);

    expect(result.success).toBe(false);
    expect(result.data).toContain('Failed to deposit into vault on Hyperliquid');
  });
});

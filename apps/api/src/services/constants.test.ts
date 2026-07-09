import { describe, it, expect } from 'vitest';
import {
  NETWORKS,
  DEFAULT_NETWORK,
  USDC_DECIMALS,
  ETH_DECIMALS,
  MAX_SLIPPAGE_BPS,
  DEFAULT_SLIPPAGE_BPS,
  MAX_TRADE_SIZE_USD,
  MAX_DAILY_VOLUME_USD,
  MISSION_STATUSES,
  AGENT_TYPES,
  getExplorerTxUrl,
  getExplorerAddressUrl,
} from '@baseagent/shared';

describe('shared constants', () => {
  it('has both network configs', () => {
    expect(NETWORKS['base-mainnet'].chainId).toBe(8453);
    expect(NETWORKS['base-sepolia'].chainId).toBe(84532);
  });

  it('mainnet USDC matches official Base address', () => {
    expect(NETWORKS['base-mainnet'].usdc).toBe('0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913');
  });

  it('sepolia USDC matches testnet address', () => {
    expect(NETWORKS['base-sepolia'].usdc).toBe('0x036CbD53842c5426634e7929541eC2318f3dCF7e');
  });

  it('default network is base-sepolia', () => {
    expect(DEFAULT_NETWORK).toBe('base-sepolia');
  });

  it('has correct decimal constants', () => {
    expect(USDC_DECIMALS).toBe(6);
    expect(ETH_DECIMALS).toBe(18);
  });

  it('has valid slippage bounds', () => {
    expect(DEFAULT_SLIPPAGE_BPS).toBe(50);
    expect(MAX_SLIPPAGE_BPS).toBe(500);
    expect(MAX_SLIPPAGE_BPS).toBeGreaterThan(DEFAULT_SLIPPAGE_BPS);
  });

  it('has numeric trade limits', () => {
    expect(parseFloat(MAX_TRADE_SIZE_USD)).toBe(10000);
    expect(parseFloat(MAX_DAILY_VOLUME_USD)).toBe(100000);
  });

  it('MISSION_STATUSES includes all expected values', () => {
    expect(MISSION_STATUSES).toContain('planning');
    expect(MISSION_STATUSES).toContain('completed');
    expect(MISSION_STATUSES).toContain('failed');
    expect(MISSION_STATUSES.length).toBe(10);
  });

  it('AGENT_TYPES includes all 8 agents', () => {
    expect(AGENT_TYPES).toContain('payment');
    expect(AGENT_TYPES).toContain('trading');
    expect(AGENT_TYPES).toContain('risk');
    expect(AGENT_TYPES).toContain('execution');
    expect(AGENT_TYPES.length).toBe(8);
  });
});

describe('explorer URL helpers', () => {
  it('builds tx URL for mainnet', () => {
    const url = getExplorerTxUrl('base-mainnet', '0xabc');
    expect(url).toBe('https://basescan.org/tx/0xabc');
  });

  it('builds tx URL for sepolia', () => {
    const url = getExplorerTxUrl('base-sepolia', '0x123');
    expect(url).toBe('https://sepolia.basescan.org/tx/0x123');
  });

  it('builds address URL for mainnet', () => {
    const url = getExplorerAddressUrl('base-mainnet', '0xwallet');
    expect(url).toBe('https://basescan.org/address/0xwallet');
  });
});

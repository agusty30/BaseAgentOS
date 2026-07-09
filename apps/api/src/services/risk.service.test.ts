import { describe, it, expect, beforeEach } from 'vitest';
import { RiskService } from '../services/risk.service.js';

let service: RiskService;

beforeEach(() => {
  service = new RiskService();
});

describe('RiskService.assess', () => {
  const base = { userId: 'u1', type: 'trade' as const, amountUsd: 100, network: 'base-sepolia' };

  it('approves a small low-risk trade', async () => {
    const result = await service.assess(base);
    expect(result.approved).toBe(true);
    expect(result.level).toBe('low');
    expect(result.blockers).toHaveLength(0);
  });

  it('blocks when emergency stop is active', async () => {
    service.setEmergencyStop(true);
    const result = await service.assess(base);
    expect(result.approved).toBe(false);
    expect(result.score).toBe(100);
    expect(result.level).toBe('critical');
    expect(result.blockers[0]).toContain('Emergency stop');
  });

  it('blocks amount exceeding max trade size', async () => {
    const result = await service.assess({ ...base, amountUsd: 50000 });
    expect(result.approved).toBe(false);
    expect(result.blockers.some(b => b.includes('exceeds maximum'))).toBe(true);
  });

  it('warns on large transactions (>50% max)', async () => {
    const result = await service.assess({ ...base, amountUsd: 6000 });
    expect(result.warnings.some(w => w.includes('Large transaction'))).toBe(true);
    expect(result.approved).toBe(true);
  });

  it('blocks blacklisted tokens', async () => {
    service.addToBlacklist('0xBADTOKEN');
    const result = await service.assess({ ...base, tokenAddress: '0xbadtoken' });
    expect(result.approved).toBe(false);
    expect(result.blockers.some(b => b.includes('blacklisted'))).toBe(true);
  });

  it('blocks slippage above MAX_SLIPPAGE_BPS', async () => {
    const result = await service.assess({ ...base, slippageBps: 600 });
    expect(result.approved).toBe(false);
    expect(result.blockers.some(b => b.includes('Slippage'))).toBe(true);
  });

  it('warns on high slippage (>3x default)', async () => {
    const result = await service.assess({ ...base, slippageBps: 200 });
    expect(result.warnings.some(w => w.includes('High slippage'))).toBe(true);
  });

  it('adds score for mainnet transactions', async () => {
    const result = await service.assess({ ...base, network: 'base-mainnet', amountUsd: 2000 });
    expect(result.warnings.some(w => w.includes('Mainnet'))).toBe(true);
    expect(result.score).toBeGreaterThan(0);
  });

  it('caps score at 100', async () => {
    service.setEmergencyStop(false);
    service.addToBlacklist('0xbad');
    const result = await service.assess({ ...base, amountUsd: 50000, tokenAddress: '0xbad', slippageBps: 600 });
    expect(result.score).toBeLessThanOrEqual(100);
  });
});

describe('RiskService token lists', () => {
  it('manages blacklist add/remove', () => {
    service.addToBlacklist('0xABC');
    expect(service.isWhitelisted('0xABC')).toBe(true);
    service.removeFromBlacklist('0xABC');
  });

  it('whitelist returns true when empty', () => {
    expect(service.isWhitelisted('0xANYTHING')).toBe(true);
  });

  it('whitelist filters when populated', () => {
    service.addToWhitelist('0xGOOD');
    expect(service.isWhitelisted('0xgood')).toBe(true);
    expect(service.isWhitelisted('0xother')).toBe(false);
  });
});

describe('emergency stop', () => {
  it('toggles on/off', () => {
    expect(service.isEmergencyStopActive()).toBe(false);
    service.setEmergencyStop(true);
    expect(service.isEmergencyStopActive()).toBe(true);
    service.setEmergencyStop(false);
    expect(service.isEmergencyStopActive()).toBe(false);
  });
});

import { describe, it, expect } from 'vitest';
import { StrategyService } from '../services/strategy.service.js';

const service = new StrategyService();

describe('StrategyService.evaluateDCA', () => {
  it('returns shouldExecute true for valid config', () => {
    const result = service.evaluateDCA({ amountPerBuy: '50', token: 'ETH', frequency: 'daily' });
    expect(result.shouldExecute).toBe(true);
    expect(result.amount).toBe(50);
    expect(result.token).toBe('ETH');
    expect(result.frequency).toBe('daily');
  });

  it('returns shouldExecute false for zero amount', () => {
    const result = service.evaluateDCA({ amountPerBuy: '0' });
    expect(result.shouldExecute).toBe(false);
  });

  it('uses defaults when keys are missing', () => {
    const result = service.evaluateDCA({});
    expect(result.amount).toBe(0);
    expect(result.token).toBe('USDC');
    expect(result.frequency).toBe('daily');
  });
});

describe('StrategyService.evaluateRebalance', () => {
  it('detects needed rebalance when allocation drifts past threshold', () => {
    const config = { targetAllocations: { ETH: 50, USDC: 50 }, threshold: '5' };
    const current = { ETH: 60, USDC: 40 };
    const result = service.evaluateRebalance(config, current);
    expect(result.needsRebalance).toBe(true);
    expect(result.trades).toHaveLength(2);
    const ethTrade = result.trades.find(t => t.token === 'ETH');
    expect(ethTrade?.action).toBe('sell');
    expect(ethTrade?.amount).toBe(10);
  });

  it('returns no trades when within threshold', () => {
    const config = { targetAllocations: { ETH: 50 }, threshold: '5' };
    const current = { ETH: 52 };
    const result = service.evaluateRebalance(config, current);
    expect(result.needsRebalance).toBe(false);
    expect(result.trades).toHaveLength(0);
  });

  it('handles tokens in target but not in current', () => {
    const config = { targetAllocations: { NEW_TOKEN: 10 }, threshold: '5' };
    const result = service.evaluateRebalance(config, {});
    expect(result.needsRebalance).toBe(true);
    expect(result.trades[0].action).toBe('buy');
    expect(result.trades[0].amount).toBe(10);
  });
});

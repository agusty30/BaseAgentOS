import { db } from '../db/index.js';
import { trades, payments, settings } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { DEFAULT_SLIPPAGE_BPS, MAX_SLIPPAGE_BPS, MAX_TRADE_SIZE_USD, MAX_DAILY_VOLUME_USD } from '@baseagent/shared';
import type { RiskAssessment } from '@baseagent/shared';

interface RiskCheckParams {
  userId: string;
  type: 'trade' | 'payment';
  amountUsd: number;
  tokenAddress?: string;
  slippageBps?: number;
  network: string;
}

export class RiskService {
  private blacklistedTokens: Set<string> = new Set();
  private whitelistedTokens: Set<string> = new Set();
  private emergencyStopActive = false;

  async assess(params: RiskCheckParams): Promise<RiskAssessment> {
    const warnings: string[] = [];
    const blockers: string[] = [];
    let score = 0;

    if (this.emergencyStopActive) {
      blockers.push('Emergency stop is active — all operations halted');
      return { score: 100, level: 'critical', warnings, blockers, approved: false };
    }

    const maxTradeSize = parseFloat(MAX_TRADE_SIZE_USD);
    if (params.amountUsd > maxTradeSize) {
      blockers.push(`Amount $${params.amountUsd} exceeds maximum trade size $${maxTradeSize}`);
      score += 40;
    }

    if (params.amountUsd > maxTradeSize * 0.5) {
      warnings.push(`Large transaction: $${params.amountUsd} is over 50% of max trade size`);
      score += 15;
    }

    if (params.tokenAddress && this.blacklistedTokens.has(params.tokenAddress.toLowerCase())) {
      blockers.push(`Token ${params.tokenAddress} is blacklisted`);
      score += 50;
    }

    if (params.slippageBps !== undefined) {
      if (params.slippageBps > MAX_SLIPPAGE_BPS) {
        blockers.push(`Slippage ${params.slippageBps}bps exceeds maximum ${MAX_SLIPPAGE_BPS}bps`);
        score += 30;
      } else if (params.slippageBps > DEFAULT_SLIPPAGE_BPS * 3) {
        warnings.push(`High slippage tolerance: ${params.slippageBps}bps`);
        score += 10;
      }
    }

    if (params.network === 'base-mainnet') {
      score += 5;
      if (params.amountUsd > 1000) {
        warnings.push('Mainnet transaction over $1,000 — verify parameters carefully');
        score += 10;
      }
    }

    const level = score >= 70 ? 'critical' : score >= 40 ? 'high' : score >= 20 ? 'medium' : 'low';
    const approved = blockers.length === 0;

    return { score: Math.min(score, 100), level, warnings, blockers, approved };
  }

  setEmergencyStop(active: boolean) {
    this.emergencyStopActive = active;
  }

  isEmergencyStopActive() {
    return this.emergencyStopActive;
  }

  addToBlacklist(tokenAddress: string) {
    this.blacklistedTokens.add(tokenAddress.toLowerCase());
  }

  removeFromBlacklist(tokenAddress: string) {
    this.blacklistedTokens.delete(tokenAddress.toLowerCase());
  }

  addToWhitelist(tokenAddress: string) {
    this.whitelistedTokens.add(tokenAddress.toLowerCase());
  }

  isWhitelisted(tokenAddress: string): boolean {
    if (this.whitelistedTokens.size === 0) return true;
    return this.whitelistedTokens.has(tokenAddress.toLowerCase());
  }
}

export const riskService = new RiskService();

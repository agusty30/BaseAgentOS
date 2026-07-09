from __future__ import annotations

from typing import Any

import structlog

from app.agents.base import BaseAgent
from app.config import settings
from app.models.schemas import RiskAssessment, RiskLevel

logger = structlog.get_logger(__name__)

# Tokens that are never allowed
_TOKEN_BLACKLIST: set[str] = set()

# If non-empty, only these tokens are allowed
_TOKEN_WHITELIST: set[str] = set()


class RiskAgent(BaseAgent):
    """Validates transactions, checks limits, calculates risk scores, and returns assessments."""

    name = "Risk Agent"
    description = "Validates transaction parameters, checks limits, token lists, and calculates risk scores."
    agent_type = "risk"

    # ------------------------------------------------------------------
    # Execute
    # ------------------------------------------------------------------

    async def execute(self, task: dict[str, Any]) -> dict[str, Any]:
        mission_id = task.get("mission_id", "unknown")
        params = task.get("params", {})

        self._mark_busy()

        try:
            await self.log_step(mission_id, "risk_assessment", "started", {"params": params})
            assessment = await self._assess(params)
            result = assessment.model_dump()
            await self.log_step(mission_id, "risk_assessment", "completed", result)
            self._record_success()
            return {"status": "completed", "assessment": result}

        except Exception as exc:
            self._record_failure()
            await self.log_step(mission_id, "risk_assessment", "failed", {"error": str(exc)})
            raise

    # ------------------------------------------------------------------
    # Public assessment entry-point (used by workflow too)
    # ------------------------------------------------------------------

    async def assess(self, params: dict[str, Any]) -> RiskAssessment:
        return await self._assess(params)

    # ------------------------------------------------------------------
    # Core risk logic
    # ------------------------------------------------------------------

    async def _assess(self, params: dict[str, Any]) -> RiskAssessment:
        warnings: list[str] = []
        blockers: list[str] = []
        score = 0.0

        transaction_type = params.get("transaction_type", "unknown")
        amount_usd = float(params.get("amount_usd", 0))
        token = params.get("token", "")
        wallet_id = params.get("wallet_id", "")

        # 1. Validate basic parameters
        if not wallet_id:
            blockers.append("Missing wallet_id")
            score += 30

        if amount_usd <= 0:
            blockers.append("Amount must be positive")
            score += 20

        # 2. Check token blacklist / whitelist
        if token.upper() in _TOKEN_BLACKLIST:
            blockers.append(f"Token {token} is blacklisted")
            score += 50

        if _TOKEN_WHITELIST and token.upper() not in _TOKEN_WHITELIST:
            blockers.append(f"Token {token} is not on the whitelist")
            score += 40

        # 3. Max trade size
        if amount_usd > settings.max_trade_size_usd:
            blockers.append(
                f"Amount ${amount_usd:,.2f} exceeds max trade size ${settings.max_trade_size_usd:,.2f}"
            )
            score += 25

        # 4. Daily volume check (best-effort via API)
        daily_volume = await self._get_daily_volume(wallet_id)
        if daily_volume + amount_usd > settings.max_daily_volume_usd:
            remaining = max(0, settings.max_daily_volume_usd - daily_volume)
            blockers.append(
                f"Trade would exceed daily volume limit. "
                f"Used: ${daily_volume:,.2f}, Limit: ${settings.max_daily_volume_usd:,.2f}, "
                f"Remaining: ${remaining:,.2f}"
            )
            score += 25

        # 5. Proportional risk from amount
        amount_ratio = min(amount_usd / settings.max_trade_size_usd, 1.0) if settings.max_trade_size_usd else 0
        score += amount_ratio * 20

        # 6. Transaction-type adjustments
        if transaction_type in ("swap", "trading"):
            score += 5  # slight risk for market operations
            if amount_usd > settings.max_trade_size_usd * 0.5:
                warnings.append("Trade is above 50% of max trade size")

        if transaction_type == "transfer":
            score += 3

        # Clamp
        score = min(score, 100.0)

        # Determine level
        if score >= 80 or blockers:
            level = RiskLevel.CRITICAL
        elif score >= 60:
            level = RiskLevel.HIGH
        elif score >= 30:
            level = RiskLevel.MEDIUM
        else:
            level = RiskLevel.LOW

        approved = len(blockers) == 0 and score < 80

        return RiskAssessment(
            score=round(score, 2),
            level=level,
            warnings=warnings,
            blockers=blockers,
            approved=approved,
        )

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    async def _get_daily_volume(self, wallet_id: str) -> float:
        """Fetch today's trading volume for the wallet from the API."""
        if not wallet_id:
            return 0.0
        try:
            resp = await self.call_api(
                "GET",
                f"/api/wallets/{wallet_id}/daily-volume",
            )
            return float(resp.get("volume_usd", 0))
        except Exception:
            return 0.0

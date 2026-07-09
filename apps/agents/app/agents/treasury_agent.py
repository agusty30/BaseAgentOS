from __future__ import annotations

from typing import Any

import structlog

from app.agents.base import BaseAgent

logger = structlog.get_logger(__name__)


class TreasuryAgent(BaseAgent):
    """Analyzes treasury allocation, recommends rebalancing, and tracks performance."""

    name = "Treasury Agent"
    description = "Analyzes treasury allocation, recommends rebalancing, and tracks wallet performance."
    agent_type = "treasury"

    # ------------------------------------------------------------------
    # Internal analysis helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _calculate_deviation(current: dict[str, float], target: dict[str, float]) -> dict[str, float]:
        """Return the percentage-point deviation for each asset."""
        all_assets = set(current) | set(target)
        return {
            asset: current.get(asset, 0.0) - target.get(asset, 0.0)
            for asset in all_assets
        }

    @staticmethod
    def _generate_rebalance_trades(
        holdings: dict[str, float],
        target_pct: dict[str, float],
        total_value: float,
    ) -> list[dict[str, Any]]:
        """Generate trades needed to reach target allocation."""
        trades: list[dict[str, Any]] = []
        for asset, target in target_pct.items():
            current_value = holdings.get(asset, 0.0)
            target_value = total_value * (target / 100.0)
            diff = target_value - current_value
            if abs(diff) < 1.0:
                continue
            trades.append({
                "asset": asset,
                "action": "buy" if diff > 0 else "sell",
                "amount_usd": abs(diff),
                "current_value_usd": current_value,
                "target_value_usd": target_value,
            })
        return trades

    # ------------------------------------------------------------------
    # Execute
    # ------------------------------------------------------------------

    async def execute(self, task: dict[str, Any]) -> dict[str, Any]:
        mission_id = task.get("mission_id", "unknown")
        params = task.get("params", {})
        wallet_id = task.get("wallet_id", "")
        network = task.get("network", "base")

        self._mark_busy()

        try:
            action = params.get("action", "analyze")

            if action == "analyze":
                return await self._analyze_allocation(mission_id, wallet_id, network)
            elif action == "rebalance":
                return await self._recommend_rebalance(mission_id, wallet_id, network, params)
            elif action == "performance":
                return await self._track_performance(mission_id, wallet_id, network, params)
            else:
                await self.log_step(mission_id, "treasury", "completed", {"message": f"Unknown action: {action}"})
                self._record_success()
                return {"status": "completed", "message": f"No handler for action '{action}'"}

        except Exception as exc:
            self._record_failure()
            await self.log_step(mission_id, "treasury", "failed", {"error": str(exc)})
            raise

    # ------------------------------------------------------------------
    # Actions
    # ------------------------------------------------------------------

    async def _analyze_allocation(
        self, mission_id: str, wallet_id: str, network: str
    ) -> dict[str, Any]:
        await self.log_step(mission_id, "analyze_allocation", "started")

        balances = await self.call_api(
            "GET",
            f"/api/wallets/{wallet_id}/balances?network={network}",
        )
        tokens: list[dict[str, Any]] = balances.get("tokens", [])

        total_value = sum(float(t.get("value_usd", 0)) for t in tokens)
        allocation: dict[str, float] = {}
        for t in tokens:
            symbol = t.get("symbol", "UNKNOWN")
            value = float(t.get("value_usd", 0))
            allocation[symbol] = round((value / total_value * 100) if total_value else 0, 2)

        result = {
            "total_value_usd": total_value,
            "allocation_pct": allocation,
            "token_count": len(tokens),
        }
        await self.log_step(mission_id, "analyze_allocation", "completed", result)
        self._record_success()
        return {"status": "completed", **result}

    async def _recommend_rebalance(
        self, mission_id: str, wallet_id: str, network: str, params: dict[str, Any]
    ) -> dict[str, Any]:
        await self.log_step(mission_id, "recommend_rebalance", "started")

        target_allocation: dict[str, float] = params.get("target_allocation", {})
        if not target_allocation:
            self._record_success()
            return {"status": "completed", "trades": [], "message": "No target allocation provided."}

        balances = await self.call_api(
            "GET",
            f"/api/wallets/{wallet_id}/balances?network={network}",
        )
        tokens: list[dict[str, Any]] = balances.get("tokens", [])
        total_value = sum(float(t.get("value_usd", 0)) for t in tokens)

        holdings: dict[str, float] = {}
        current_pct: dict[str, float] = {}
        for t in tokens:
            symbol = t.get("symbol", "UNKNOWN")
            value = float(t.get("value_usd", 0))
            holdings[symbol] = value
            current_pct[symbol] = round((value / total_value * 100) if total_value else 0, 2)

        deviation = self._calculate_deviation(current_pct, target_allocation)
        trades = self._generate_rebalance_trades(holdings, target_allocation, total_value)

        result = {
            "total_value_usd": total_value,
            "current_allocation": current_pct,
            "target_allocation": target_allocation,
            "deviation": deviation,
            "recommended_trades": trades,
        }
        await self.log_step(mission_id, "recommend_rebalance", "completed", result)
        self._record_success()
        return {"status": "completed", **result}

    async def _track_performance(
        self, mission_id: str, wallet_id: str, network: str, params: dict[str, Any]
    ) -> dict[str, Any]:
        await self.log_step(mission_id, "track_performance", "started")

        period = params.get("period", "7d")

        try:
            performance = await self.call_api(
                "GET",
                f"/api/wallets/{wallet_id}/performance?network={network}&period={period}",
            )
        except Exception:
            performance = {
                "period": period,
                "start_value_usd": 0.0,
                "end_value_usd": 0.0,
                "change_pct": 0.0,
                "message": "Performance data unavailable",
            }

        await self.log_step(mission_id, "track_performance", "completed", performance)
        self._record_success()
        return {"status": "completed", **performance}

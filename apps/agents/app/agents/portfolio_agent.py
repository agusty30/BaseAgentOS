from __future__ import annotations

from typing import Any

import structlog

from app.agents.base import BaseAgent

logger = structlog.get_logger(__name__)


class PortfolioAgent(BaseAgent):
    """Calculates portfolio value, tracks holdings, computes P/L, and generates reports."""

    name = "Portfolio Agent"
    description = "Calculates portfolio value, tracks token holdings, computes P/L, and generates reports."
    agent_type = "portfolio"

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
                return await self._full_analysis(mission_id, wallet_id, network)
            elif action == "holdings":
                return await self._track_holdings(mission_id, wallet_id, network)
            elif action == "pnl":
                return await self._compute_pnl(mission_id, wallet_id, network, params)
            elif action == "report":
                return await self._generate_report(mission_id, wallet_id, network, params)
            else:
                self._record_success()
                return {"status": "completed", "message": f"Unknown portfolio action '{action}'"}

        except Exception as exc:
            self._record_failure()
            await self.log_step(mission_id, "portfolio", "failed", {"error": str(exc)})
            raise

    # ------------------------------------------------------------------
    # Actions
    # ------------------------------------------------------------------

    async def _track_holdings(
        self, mission_id: str, wallet_id: str, network: str
    ) -> dict[str, Any]:
        await self.log_step(mission_id, "track_holdings", "started")

        balances = await self.call_api(
            "GET",
            f"/api/wallets/{wallet_id}/balances?network={network}",
        )
        tokens: list[dict[str, Any]] = balances.get("tokens", [])

        holdings = []
        total_value = 0.0
        for t in tokens:
            value = float(t.get("value_usd", 0))
            total_value += value
            holdings.append({
                "symbol": t.get("symbol", ""),
                "balance": float(t.get("balance", 0)),
                "price_usd": float(t.get("price_usd", 0)),
                "value_usd": value,
            })

        result = {
            "total_value_usd": total_value,
            "holdings": holdings,
            "token_count": len(holdings),
        }
        await self.log_step(mission_id, "track_holdings", "completed", result)
        self._record_success()
        return {"status": "completed", **result}

    async def _compute_pnl(
        self, mission_id: str, wallet_id: str, network: str, params: dict[str, Any]
    ) -> dict[str, Any]:
        await self.log_step(mission_id, "compute_pnl", "started")

        period = params.get("period", "30d")

        try:
            tx_history = await self.call_api(
                "GET",
                f"/api/wallets/{wallet_id}/transactions?network={network}&period={period}",
            )
        except Exception:
            tx_history = {"transactions": []}

        transactions: list[dict[str, Any]] = tx_history.get("transactions", [])

        realized_pl = 0.0
        for tx in transactions:
            if tx.get("type") in ("sell", "swap_out"):
                cost_basis = float(tx.get("cost_basis_usd", 0))
                proceeds = float(tx.get("proceeds_usd", 0))
                realized_pl += proceeds - cost_basis

        # Unrealized P/L from current holdings vs cost basis
        balances = await self.call_api(
            "GET",
            f"/api/wallets/{wallet_id}/balances?network={network}",
        )
        tokens: list[dict[str, Any]] = balances.get("tokens", [])

        unrealized_pl = 0.0
        for t in tokens:
            current_value = float(t.get("value_usd", 0))
            cost_basis = float(t.get("cost_basis_usd", current_value))
            unrealized_pl += current_value - cost_basis

        result = {
            "period": period,
            "realized_pl_usd": round(realized_pl, 2),
            "unrealized_pl_usd": round(unrealized_pl, 2),
            "total_pl_usd": round(realized_pl + unrealized_pl, 2),
            "transaction_count": len(transactions),
        }
        await self.log_step(mission_id, "compute_pnl", "completed", result)
        self._record_success()
        return {"status": "completed", **result}

    async def _full_analysis(
        self, mission_id: str, wallet_id: str, network: str
    ) -> dict[str, Any]:
        """Combined holdings + P/L + allocation analysis."""
        await self.log_step(mission_id, "full_analysis", "started")

        # Holdings
        balances = await self.call_api(
            "GET",
            f"/api/wallets/{wallet_id}/balances?network={network}",
        )
        tokens: list[dict[str, Any]] = balances.get("tokens", [])

        total_value = 0.0
        holdings: list[dict[str, Any]] = []
        allocation: dict[str, float] = {}
        unrealized_pl = 0.0

        for t in tokens:
            value = float(t.get("value_usd", 0))
            cost_basis = float(t.get("cost_basis_usd", value))
            total_value += value
            unrealized_pl += value - cost_basis
            symbol = t.get("symbol", "UNKNOWN")
            holdings.append({
                "symbol": symbol,
                "balance": float(t.get("balance", 0)),
                "price_usd": float(t.get("price_usd", 0)),
                "value_usd": value,
                "cost_basis_usd": cost_basis,
                "unrealized_pl_usd": round(value - cost_basis, 2),
            })

        for h in holdings:
            pct = (h["value_usd"] / total_value * 100) if total_value else 0
            allocation[h["symbol"]] = round(pct, 2)

        # Realized P/L
        try:
            tx_history = await self.call_api(
                "GET",
                f"/api/wallets/{wallet_id}/transactions?network={network}&period=all",
            )
            transactions = tx_history.get("transactions", [])
            realized_pl = sum(
                float(tx.get("proceeds_usd", 0)) - float(tx.get("cost_basis_usd", 0))
                for tx in transactions
                if tx.get("type") in ("sell", "swap_out")
            )
        except Exception:
            realized_pl = 0.0

        result = {
            "total_value_usd": round(total_value, 2),
            "holdings": holdings,
            "allocation": allocation,
            "realized_pl_usd": round(realized_pl, 2),
            "unrealized_pl_usd": round(unrealized_pl, 2),
            "total_pl_usd": round(realized_pl + unrealized_pl, 2),
        }
        await self.log_step(mission_id, "full_analysis", "completed", result)
        self._record_success()
        return {"status": "completed", **result}

    async def _generate_report(
        self, mission_id: str, wallet_id: str, network: str, params: dict[str, Any]
    ) -> dict[str, Any]:
        """Generate a summary report combining all portfolio data."""
        await self.log_step(mission_id, "generate_report", "started")

        analysis = await self._full_analysis(mission_id, wallet_id, network)

        # Concentration risk
        allocation: dict[str, float] = analysis.get("allocation", {})
        concentrated_assets = [
            {"asset": asset, "pct": pct}
            for asset, pct in allocation.items()
            if pct > 30.0
        ]

        report = {
            "wallet_id": wallet_id,
            "network": network,
            "total_value_usd": analysis.get("total_value_usd", 0),
            "holding_count": len(analysis.get("holdings", [])),
            "top_holdings": sorted(
                analysis.get("holdings", []),
                key=lambda h: h.get("value_usd", 0),
                reverse=True,
            )[:5],
            "realized_pl_usd": analysis.get("realized_pl_usd", 0),
            "unrealized_pl_usd": analysis.get("unrealized_pl_usd", 0),
            "concentration_warnings": concentrated_assets,
            "diversification_score": max(0, 100 - sum(max(0, pct - 25) for pct in allocation.values())),
        }

        await self.log_step(mission_id, "generate_report", "completed", report)
        self._record_success()
        return {"status": "completed", "report": report}

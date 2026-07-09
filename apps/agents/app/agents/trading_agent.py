from __future__ import annotations

from typing import Any

import structlog

from app.agents.base import AgentValidationError, BaseAgent

logger = structlog.get_logger(__name__)


class TradingAgent(BaseAgent):
    """Fetches DEX quotes, compares routes, executes swaps, and tracks performance."""

    name = "Trading Agent"
    description = "Fetches DEX quotes, compares routes across providers, executes swaps, and tracks trade performance."
    agent_type = "trading"

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _select_best_route(quotes: list[dict[str, Any]]) -> dict[str, Any]:
        """Pick the route with the best output amount."""
        if not quotes:
            return {}
        return max(quotes, key=lambda q: float(q.get("output_amount", 0)))

    @staticmethod
    def _compute_slippage(expected: float, actual: float) -> float:
        if expected == 0:
            return 0.0
        return round(abs(expected - actual) / expected * 100, 4)

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
            action = params.get("action", "swap")

            if action == "quote":
                return await self._fetch_quotes(mission_id, params, network)
            elif action == "swap":
                return await self._execute_swap(mission_id, params, wallet_id, network)
            elif action == "performance":
                return await self._track_performance(mission_id, wallet_id, network, params)
            else:
                self._record_success()
                return {"status": "completed", "message": f"Unknown trading action '{action}'"}

        except AgentValidationError:
            self._record_failure()
            raise
        except Exception as exc:
            self._record_failure()
            await self.log_step(mission_id, "trading", "failed", {"error": str(exc)})
            raise

    # ------------------------------------------------------------------
    # Actions
    # ------------------------------------------------------------------

    async def _fetch_quotes(
        self, mission_id: str, params: dict[str, Any], network: str
    ) -> dict[str, Any]:
        await self.log_step(mission_id, "fetch_quotes", "started")

        token_in = params.get("token_in", "")
        token_out = params.get("token_out", "")
        amount = float(params.get("amount", 0))

        if not token_in or not token_out or amount <= 0:
            raise AgentValidationError(
                "token_in, token_out, and a positive amount are required",
                agent_type=self.agent_type,
            )

        quotes_response = await self.call_api(
            "POST",
            "/api/dex/quotes",
            {
                "token_in": token_in,
                "token_out": token_out,
                "amount": amount,
                "network": network,
            },
        )

        quotes: list[dict[str, Any]] = quotes_response.get("quotes", [])
        best = self._select_best_route(quotes)

        result = {
            "quotes": quotes,
            "best_route": best,
            "token_in": token_in,
            "token_out": token_out,
            "amount": amount,
        }
        await self.log_step(mission_id, "fetch_quotes", "completed", result)
        self._record_success()
        return {"status": "completed", **result}

    async def _execute_swap(
        self,
        mission_id: str,
        params: dict[str, Any],
        wallet_id: str,
        network: str,
    ) -> dict[str, Any]:
        # Step 1: Fetch quotes
        await self.log_step(mission_id, "swap_quote", "started")
        token_in = params.get("token_in", "")
        token_out = params.get("token_out", "")
        amount = float(params.get("amount", 0))
        slippage_tolerance = float(params.get("slippage_tolerance", 0.5))

        if not token_in or not token_out or amount <= 0:
            raise AgentValidationError(
                "token_in, token_out, and a positive amount are required for swap",
                agent_type=self.agent_type,
            )

        quotes_response = await self.call_api(
            "POST",
            "/api/dex/quotes",
            {
                "token_in": token_in,
                "token_out": token_out,
                "amount": amount,
                "network": network,
            },
        )
        quotes: list[dict[str, Any]] = quotes_response.get("quotes", [])
        best = self._select_best_route(quotes)

        if not best:
            raise AgentValidationError(
                "No valid routes found for this swap pair",
                agent_type=self.agent_type,
            )
        await self.log_step(mission_id, "swap_quote", "completed", {"best_route": best})

        # Step 2: Compare routes
        await self.log_step(mission_id, "compare_routes", "started")
        comparison = {
            "routes_evaluated": len(quotes),
            "best_provider": best.get("provider", "unknown"),
            "best_output": float(best.get("output_amount", 0)),
        }
        await self.log_step(mission_id, "compare_routes", "completed", comparison)

        # Step 3: Execute swap
        await self.log_step(mission_id, "execute_swap", "started")
        swap_result = await self.call_api(
            "POST",
            "/api/dex/swap",
            {
                "wallet_id": wallet_id,
                "token_in": token_in,
                "token_out": token_out,
                "amount": amount,
                "route": best,
                "slippage_tolerance": slippage_tolerance,
                "network": network,
            },
        )
        await self.log_step(mission_id, "execute_swap", "completed", {"swap": swap_result})

        # Step 4: Track performance
        actual_output = float(swap_result.get("output_amount", 0))
        expected_output = float(best.get("output_amount", 0))
        slippage = self._compute_slippage(expected_output, actual_output)

        performance = {
            "expected_output": expected_output,
            "actual_output": actual_output,
            "slippage_pct": slippage,
            "tx_hash": swap_result.get("tx_hash", ""),
        }
        await self.log_step(mission_id, "trade_performance", "completed", performance)

        self._record_success()
        return {
            "status": "completed",
            "swap": swap_result,
            "comparison": comparison,
            "performance": performance,
        }

    async def _track_performance(
        self, mission_id: str, wallet_id: str, network: str, params: dict[str, Any]
    ) -> dict[str, Any]:
        await self.log_step(mission_id, "trade_history", "started")

        period = params.get("period", "7d")
        try:
            history = await self.call_api(
                "GET",
                f"/api/dex/history?wallet_id={wallet_id}&network={network}&period={period}",
            )
        except Exception:
            history = {"trades": [], "message": "Trade history unavailable"}

        trades: list[dict[str, Any]] = history.get("trades", [])
        total_volume = sum(float(t.get("value_usd", 0)) for t in trades)
        total_fees = sum(float(t.get("fee_usd", 0)) for t in trades)

        result = {
            "period": period,
            "trade_count": len(trades),
            "total_volume_usd": total_volume,
            "total_fees_usd": total_fees,
            "trades": trades,
        }
        await self.log_step(mission_id, "trade_history", "completed", result)
        self._record_success()
        return {"status": "completed", **result}

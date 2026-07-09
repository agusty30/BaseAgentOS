from __future__ import annotations

from datetime import datetime
from typing import Any

import structlog

from app.agents.base import BaseAgent

logger = structlog.get_logger(__name__)


class AnalyticsAgent(BaseAgent):
    """Calculates traction metrics, generates reports, and computes KPIs."""

    name = "Analytics Agent"
    description = "Calculates traction metrics from execution history, generates periodic reports, and computes KPIs."
    agent_type = "analytics"

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
            action = params.get("action", "kpis")

            if action == "kpis":
                return await self._compute_kpis(mission_id, wallet_id, network, params)
            elif action == "traction":
                return await self._traction_metrics(mission_id, wallet_id, network, params)
            elif action == "report":
                return await self._generate_report(mission_id, wallet_id, network, params)
            else:
                self._record_success()
                return {"status": "completed", "message": f"Unknown analytics action '{action}'"}

        except Exception as exc:
            self._record_failure()
            await self.log_step(mission_id, "analytics", "failed", {"error": str(exc)})
            raise

    # ------------------------------------------------------------------
    # KPIs
    # ------------------------------------------------------------------

    async def _compute_kpis(
        self, mission_id: str, wallet_id: str, network: str, params: dict[str, Any]
    ) -> dict[str, Any]:
        await self.log_step(mission_id, "compute_kpis", "started")

        period = params.get("period", "30d")

        # Fetch aggregated data from API
        try:
            stats = await self.call_api(
                "GET",
                f"/api/analytics/stats?wallet_id={wallet_id}&network={network}&period={period}",
            )
        except Exception:
            stats = {}

        total_missions = int(stats.get("total_missions", 0))
        successful = int(stats.get("successful_missions", 0))
        failed = int(stats.get("failed_missions", 0))
        total_volume = float(stats.get("total_volume_usd", 0))
        total_fees = float(stats.get("total_fees_usd", 0))
        avg_execution_time_s = float(stats.get("avg_execution_time_s", 0))

        success_rate = (successful / total_missions * 100) if total_missions else 0.0

        kpis = {
            "period": period,
            "total_missions": total_missions,
            "successful_missions": successful,
            "failed_missions": failed,
            "success_rate_pct": round(success_rate, 2),
            "total_volume_usd": round(total_volume, 2),
            "total_fees_usd": round(total_fees, 2),
            "avg_execution_time_s": round(avg_execution_time_s, 2),
            "computed_at": datetime.utcnow().isoformat(),
        }

        await self.log_step(mission_id, "compute_kpis", "completed", kpis)
        self._record_success()
        return {"status": "completed", "kpis": kpis}

    # ------------------------------------------------------------------
    # Traction metrics
    # ------------------------------------------------------------------

    async def _traction_metrics(
        self, mission_id: str, wallet_id: str, network: str, params: dict[str, Any]
    ) -> dict[str, Any]:
        await self.log_step(mission_id, "traction_metrics", "started")

        period = params.get("period", "7d")

        try:
            history = await self.call_api(
                "GET",
                f"/api/analytics/history?wallet_id={wallet_id}&network={network}&period={period}",
            )
        except Exception:
            history = {"entries": []}

        entries: list[dict[str, Any]] = history.get("entries", [])

        # Compute daily active missions
        daily_counts: dict[str, int] = {}
        for entry in entries:
            day = entry.get("date", "unknown")
            daily_counts[day] = daily_counts.get(day, 0) + 1

        peak_day = max(daily_counts, key=daily_counts.get) if daily_counts else "N/A"
        avg_daily = round(sum(daily_counts.values()) / len(daily_counts), 2) if daily_counts else 0

        # Task type breakdown
        type_breakdown: dict[str, int] = {}
        for entry in entries:
            task_type = entry.get("task_type", "unknown")
            type_breakdown[task_type] = type_breakdown.get(task_type, 0) + 1

        metrics = {
            "period": period,
            "total_executions": len(entries),
            "daily_average": avg_daily,
            "peak_day": peak_day,
            "peak_day_count": daily_counts.get(peak_day, 0) if peak_day != "N/A" else 0,
            "task_type_breakdown": type_breakdown,
        }

        await self.log_step(mission_id, "traction_metrics", "completed", metrics)
        self._record_success()
        return {"status": "completed", "metrics": metrics}

    # ------------------------------------------------------------------
    # Periodic report
    # ------------------------------------------------------------------

    async def _generate_report(
        self, mission_id: str, wallet_id: str, network: str, params: dict[str, Any]
    ) -> dict[str, Any]:
        await self.log_step(mission_id, "generate_analytics_report", "started")

        period = params.get("period", "30d")

        # Gather KPIs and traction in one pass
        kpis_result = await self._compute_kpis(mission_id, wallet_id, network, {"period": period})
        traction_result = await self._traction_metrics(mission_id, wallet_id, network, {"period": period})

        report = {
            "generated_at": datetime.utcnow().isoformat(),
            "wallet_id": wallet_id,
            "network": network,
            "period": period,
            "kpis": kpis_result.get("kpis", {}),
            "traction": traction_result.get("metrics", {}),
        }

        # Persist report via API
        try:
            await self.call_api("POST", "/api/analytics/reports", report)
        except Exception:
            await logger.awarning("analytics.report_persist_failed", mission_id=mission_id)

        await self.log_step(mission_id, "generate_analytics_report", "completed", report)
        self._record_success()
        return {"status": "completed", "report": report}

from __future__ import annotations

from typing import Any

import structlog

from app.agents.base import BaseAgent
from app.models.schemas import NotificationCategory

logger = structlog.get_logger(__name__)


class NotificationAgent(BaseAgent):
    """Sends notifications to the API for storage and delivery."""

    name = "Notification Agent"
    description = "Sends categorised notifications to the API for storage and downstream delivery."
    agent_type = "notification"

    # ------------------------------------------------------------------
    # Execute
    # ------------------------------------------------------------------

    async def execute(self, task: dict[str, Any]) -> dict[str, Any]:
        mission_id = task.get("mission_id", "unknown")
        params = task.get("params", {})
        user_id = task.get("user_id", "")

        self._mark_busy()

        try:
            await self.log_step(mission_id, "send_notification", "started", {"params": params})

            category_raw = params.get("category", "info")
            try:
                category = NotificationCategory(category_raw)
            except ValueError:
                category = NotificationCategory.INFO

            title = params.get("title", "Agent Notification")
            message = params.get("message", "")
            metadata = params.get("metadata", {})

            notification_payload = {
                "user_id": user_id,
                "title": title,
                "message": message,
                "category": category.value,
                "mission_id": mission_id,
                "metadata": metadata,
            }

            result = await self.call_api(
                "POST",
                "/api/notifications",
                notification_payload,
            )

            await self.log_step(mission_id, "send_notification", "completed", {
                "notification_id": result.get("id", ""),
                "category": category.value,
            })
            self._record_success()
            return {
                "status": "completed",
                "notification_id": result.get("id", ""),
                "category": category.value,
            }

        except Exception as exc:
            self._record_failure()
            await self.log_step(mission_id, "send_notification", "failed", {"error": str(exc)})
            raise

    # ------------------------------------------------------------------
    # Convenience methods (used by other agents / workflows)
    # ------------------------------------------------------------------

    async def notify_info(self, user_id: str, mission_id: str, title: str, message: str) -> dict[str, Any]:
        return await self.execute({
            "mission_id": mission_id,
            "user_id": user_id,
            "params": {"category": "info", "title": title, "message": message},
        })

    async def notify_success(self, user_id: str, mission_id: str, title: str, message: str) -> dict[str, Any]:
        return await self.execute({
            "mission_id": mission_id,
            "user_id": user_id,
            "params": {"category": "success", "title": title, "message": message},
        })

    async def notify_warning(self, user_id: str, mission_id: str, title: str, message: str) -> dict[str, Any]:
        return await self.execute({
            "mission_id": mission_id,
            "user_id": user_id,
            "params": {"category": "warning", "title": title, "message": message},
        })

    async def notify_error(self, user_id: str, mission_id: str, title: str, message: str) -> dict[str, Any]:
        return await self.execute({
            "mission_id": mission_id,
            "user_id": user_id,
            "params": {"category": "error", "title": title, "message": message},
        })

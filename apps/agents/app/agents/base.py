from __future__ import annotations

import abc
from datetime import datetime
from typing import Any

import httpx
import structlog

from app.config import settings
from app.memory.store import AgentMemory
from app.models.schemas import AgentStatus, StepLog

logger = structlog.get_logger(__name__)


class AgentError(Exception):
    """Base exception raised by agents."""

    def __init__(self, message: str, agent_type: str = "", details: dict[str, Any] | None = None) -> None:
        super().__init__(message)
        self.agent_type = agent_type
        self.details = details or {}


class AgentTimeoutError(AgentError):
    """Raised when an agent task exceeds the configured timeout."""


class AgentValidationError(AgentError):
    """Raised when input validation fails inside an agent."""


class BaseAgent(abc.ABC):
    """Abstract base class for every domain agent.

    Subclasses MUST set ``name``, ``description``, and ``agent_type``
    and implement ``execute``.
    """

    name: str = ""
    description: str = ""
    agent_type: str = ""

    def __init__(self) -> None:
        self._status = AgentStatus(agent_type=self.agent_type, status="idle")
        self._http: httpx.AsyncClient | None = None

    # ------------------------------------------------------------------
    # HTTP client (lazy, reusable)
    # ------------------------------------------------------------------

    def _client(self) -> httpx.AsyncClient:
        if self._http is None or self._http.is_closed:
            self._http = httpx.AsyncClient(
                base_url=settings.api_service_url,
                timeout=httpx.Timeout(30.0, connect=10.0),
                headers={"Content-Type": "application/json"},
            )
        return self._http

    async def close(self) -> None:
        if self._http is not None and not self._http.is_closed:
            await self._http.aclose()
            self._http = None

    # ------------------------------------------------------------------
    # Core interface
    # ------------------------------------------------------------------

    @abc.abstractmethod
    async def execute(self, task: dict[str, Any]) -> dict[str, Any]:
        """Run the agent's primary task and return a result dict."""

    async def health_check(self) -> dict[str, Any]:
        """Return a health-check payload for this agent."""
        return {
            "agent_type": self.agent_type,
            "status": self._status.status,
            "last_heartbeat": self._status.last_heartbeat.isoformat(),
            "tasks_completed": self._status.tasks_completed,
            "error_count": self._status.error_count,
        }

    # ------------------------------------------------------------------
    # Step logging
    # ------------------------------------------------------------------

    async def log_step(
        self,
        mission_id: str,
        step: str,
        status: str,
        data: dict[str, Any] | None = None,
    ) -> None:
        entry = StepLog(
            mission_id=mission_id,
            step=step,
            status=status,
            data=data or {},
        )
        await AgentMemory.append_step(mission_id, entry.model_dump())
        await AgentMemory.publish_mission_update(
            mission_id,
            {"step": step, "status": status, "data": data or {}},
        )
        await logger.ainfo(
            "agent.step",
            agent=self.agent_type,
            mission_id=mission_id,
            step=step,
            status=status,
        )

    # ------------------------------------------------------------------
    # API helper
    # ------------------------------------------------------------------

    async def call_api(
        self,
        method: str,
        path: str,
        data: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Call the upstream Fastify API service and return the JSON body."""
        client = self._client()
        try:
            response = await client.request(method, path, json=data)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as exc:
            await logger.aerror(
                "agent.api_error",
                agent=self.agent_type,
                method=method,
                path=path,
                status=exc.response.status_code,
                body=exc.response.text[:500],
            )
            raise AgentError(
                f"API call failed: {method} {path} -> {exc.response.status_code}",
                agent_type=self.agent_type,
                details={"status": exc.response.status_code, "body": exc.response.text[:500]},
            ) from exc
        except httpx.RequestError as exc:
            await logger.aerror(
                "agent.api_request_error",
                agent=self.agent_type,
                method=method,
                path=path,
                error=str(exc),
            )
            raise AgentError(
                f"API request error: {method} {path} -> {exc}",
                agent_type=self.agent_type,
            ) from exc

    # ------------------------------------------------------------------
    # Internal bookkeeping
    # ------------------------------------------------------------------

    def _record_success(self) -> None:
        self._status.tasks_completed += 1
        self._status.last_heartbeat = datetime.utcnow()
        self._status.status = "idle"

    def _record_failure(self) -> None:
        self._status.error_count += 1
        self._status.last_heartbeat = datetime.utcnow()
        self._status.status = "error"

    def _mark_busy(self) -> None:
        self._status.status = "busy"
        self._status.last_heartbeat = datetime.utcnow()

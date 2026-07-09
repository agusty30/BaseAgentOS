from __future__ import annotations

import json
from typing import Any

import redis.asyncio as aioredis
import structlog

from app.config import settings

logger = structlog.get_logger(__name__)


class AgentMemory:
    """Redis-backed key-value store for agent context and mission state."""

    _pool: aioredis.Redis | None = None

    # ------------------------------------------------------------------
    # Connection lifecycle
    # ------------------------------------------------------------------

    @classmethod
    async def connect(cls) -> None:
        if cls._pool is None:
            cls._pool = aioredis.from_url(
                settings.redis_url,
                decode_responses=True,
                max_connections=20,
            )
            await logger.ainfo("agent_memory.connected", url=settings.redis_url)

    @classmethod
    async def disconnect(cls) -> None:
        if cls._pool is not None:
            await cls._pool.aclose()
            cls._pool = None
            await logger.ainfo("agent_memory.disconnected")

    @classmethod
    def _redis(cls) -> aioredis.Redis:
        if cls._pool is None:
            raise RuntimeError("AgentMemory is not connected. Call AgentMemory.connect() first.")
        return cls._pool

    # ------------------------------------------------------------------
    # Generic key-value
    # ------------------------------------------------------------------

    @classmethod
    async def set(cls, key: str, value: Any, ttl: int | None = None) -> None:
        payload = json.dumps(value, default=str)
        effective_ttl = ttl if ttl is not None else settings.memory_ttl_s
        await cls._redis().set(key, payload, ex=effective_ttl)

    @classmethod
    async def get(cls, key: str) -> Any | None:
        raw = await cls._redis().get(key)
        if raw is None:
            return None
        return json.loads(raw)

    @classmethod
    async def delete(cls, key: str) -> None:
        await cls._redis().delete(key)

    @classmethod
    async def exists(cls, key: str) -> bool:
        return bool(await cls._redis().exists(key))

    # ------------------------------------------------------------------
    # Agent conversation context
    # ------------------------------------------------------------------

    @classmethod
    def _agent_ctx_key(cls, agent_type: str, session_id: str) -> str:
        return f"agent:{agent_type}:ctx:{session_id}"

    @classmethod
    async def save_agent_context(
        cls,
        agent_type: str,
        session_id: str,
        context: dict[str, Any],
        ttl: int | None = None,
    ) -> None:
        key = cls._agent_ctx_key(agent_type, session_id)
        await cls.set(key, context, ttl=ttl)

    @classmethod
    async def load_agent_context(
        cls,
        agent_type: str,
        session_id: str,
    ) -> dict[str, Any]:
        key = cls._agent_ctx_key(agent_type, session_id)
        data = await cls.get(key)
        return data if isinstance(data, dict) else {}

    @classmethod
    async def clear_agent_context(cls, agent_type: str, session_id: str) -> None:
        key = cls._agent_ctx_key(agent_type, session_id)
        await cls.delete(key)

    # ------------------------------------------------------------------
    # Mission context
    # ------------------------------------------------------------------

    @classmethod
    def _mission_key(cls, mission_id: str) -> str:
        return f"mission:{mission_id}"

    @classmethod
    async def save_mission(cls, mission_id: str, state: dict[str, Any], ttl: int | None = None) -> None:
        key = cls._mission_key(mission_id)
        await cls.set(key, state, ttl=ttl)

    @classmethod
    async def load_mission(cls, mission_id: str) -> dict[str, Any]:
        key = cls._mission_key(mission_id)
        data = await cls.get(key)
        return data if isinstance(data, dict) else {}

    @classmethod
    async def delete_mission(cls, mission_id: str) -> None:
        key = cls._mission_key(mission_id)
        await cls.delete(key)

    # ------------------------------------------------------------------
    # Mission step log (append-only list)
    # ------------------------------------------------------------------

    @classmethod
    def _steps_key(cls, mission_id: str) -> str:
        return f"mission:{mission_id}:steps"

    @classmethod
    async def append_step(cls, mission_id: str, step: dict[str, Any], ttl: int | None = None) -> None:
        key = cls._steps_key(mission_id)
        payload = json.dumps(step, default=str)
        await cls._redis().rpush(key, payload)
        effective_ttl = ttl if ttl is not None else settings.memory_ttl_s
        await cls._redis().expire(key, effective_ttl)

    @classmethod
    async def get_steps(cls, mission_id: str) -> list[dict[str, Any]]:
        key = cls._steps_key(mission_id)
        raw_items = await cls._redis().lrange(key, 0, -1)
        return [json.loads(item) for item in raw_items]

    # ------------------------------------------------------------------
    # Pub/Sub helpers (mission updates)
    # ------------------------------------------------------------------

    @classmethod
    def _mission_channel(cls, mission_id: str) -> str:
        return f"mission:{mission_id}:updates"

    @classmethod
    async def publish_mission_update(cls, mission_id: str, update: dict[str, Any]) -> None:
        channel = cls._mission_channel(mission_id)
        payload = json.dumps(update, default=str)
        await cls._redis().publish(channel, payload)

    @classmethod
    async def subscribe_mission(cls, mission_id: str) -> aioredis.client.PubSub:
        pubsub = cls._redis().pubsub()
        await pubsub.subscribe(cls._mission_channel(mission_id))
        return pubsub

    # ------------------------------------------------------------------
    # Health
    # ------------------------------------------------------------------

    @classmethod
    async def ping(cls) -> bool:
        try:
            return bool(await cls._redis().ping())
        except Exception:
            return False

from __future__ import annotations

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""

    # Database
    database_url: str = "postgresql://baseagent:baseagent@localhost:5432/baseagent"

    # Redis
    redis_url: str = "redis://localhost:6379"

    # Upstream Fastify API
    api_service_url: str = "http://localhost:3001"

    # LLM keys (optional at startup; required when LLM features are used)
    openai_api_key: str = ""
    anthropic_api_key: str = ""

    # Service identity
    service_name: str = "agents"
    service_version: str = "0.1.0"
    environment: str = "development"
    log_level: str = "INFO"

    # Agent defaults
    agent_heartbeat_interval_s: int = 30
    agent_task_timeout_s: int = 300
    agent_max_retries: int = 3

    # Risk limits
    max_trade_size_usd: float = 10_000.0
    max_daily_volume_usd: float = 50_000.0

    # Redis key TTL (seconds)
    memory_ttl_s: int = 86400  # 24 hours

    model_config = {"env_prefix": "", "case_sensitive": False}


settings = Settings()

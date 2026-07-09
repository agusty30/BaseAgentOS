from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class TaskType(str, Enum):
    PAYMENT = "payment"
    TREASURY = "treasury"
    TRADING = "trading"
    PORTFOLIO = "portfolio"
    RISK = "risk"
    NOTIFICATION = "notification"
    ANALYTICS = "analytics"
    EXECUTION = "execution"


class MissionStatus(str, Enum):
    PENDING = "pending"
    PLANNING = "planning"
    VALIDATING = "validating"
    RISK_CHECK = "risk_check"
    SIMULATING = "simulating"
    AWAITING_APPROVAL = "awaiting_approval"
    EXECUTING = "executing"
    CONFIRMING = "confirming"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class NotificationCategory(str, Enum):
    INFO = "info"
    SUCCESS = "success"
    WARNING = "warning"
    ERROR = "error"


# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------

class TaskRequest(BaseModel):
    task_type: TaskType
    params: dict[str, Any] = Field(default_factory=dict)
    wallet_id: str
    network: str = "base"
    user_id: str
    correlation_id: str = Field(default_factory=lambda: str(uuid4()))


class TaskResponse(BaseModel):
    mission_id: str = Field(default_factory=lambda: str(uuid4()))
    status: str = "pending"
    message: str = ""
    result: dict[str, Any] | None = None


class AgentStatus(BaseModel):
    agent_type: str
    status: str = "idle"
    last_heartbeat: datetime = Field(default_factory=datetime.utcnow)
    tasks_completed: int = 0
    error_count: int = 0


class WorkflowState(BaseModel):
    mission_id: str = Field(default_factory=lambda: str(uuid4()))
    current_step: str = ""
    steps: list[str] = Field(default_factory=list)
    status: MissionStatus = MissionStatus.PENDING
    context: dict[str, Any] = Field(default_factory=dict)


class RiskAssessment(BaseModel):
    score: float = 0.0
    level: RiskLevel = RiskLevel.LOW
    warnings: list[str] = Field(default_factory=list)
    blockers: list[str] = Field(default_factory=list)
    approved: bool = True


class StrategyConfig(BaseModel):
    type: str
    params: dict[str, Any] = Field(default_factory=dict)
    limits: dict[str, Any] = Field(default_factory=dict)
    schedule: str = ""


# ---------------------------------------------------------------------------
# Workflow step log entry
# ---------------------------------------------------------------------------

class StepLog(BaseModel):
    mission_id: str
    step: str
    status: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    data: dict[str, Any] = Field(default_factory=dict)


# ---------------------------------------------------------------------------
# Strategy evaluation
# ---------------------------------------------------------------------------

class StrategyEvaluationRequest(BaseModel):
    strategy: StrategyConfig
    wallet_id: str
    network: str = "base"


class StrategyEvaluationResponse(BaseModel):
    viable: bool
    estimated_trades: int = 0
    estimated_cost_usd: float = 0.0
    warnings: list[str] = Field(default_factory=list)
    details: dict[str, Any] = Field(default_factory=dict)


# ---------------------------------------------------------------------------
# Portfolio analysis
# ---------------------------------------------------------------------------

class PortfolioAnalysisRequest(BaseModel):
    wallet_id: str
    network: str = "base"


class PortfolioAnalysisResponse(BaseModel):
    total_value_usd: float = 0.0
    holdings: list[dict[str, Any]] = Field(default_factory=list)
    realized_pl_usd: float = 0.0
    unrealized_pl_usd: float = 0.0
    allocation: dict[str, float] = Field(default_factory=dict)


# ---------------------------------------------------------------------------
# Risk assessment request
# ---------------------------------------------------------------------------

class RiskAssessmentRequest(BaseModel):
    transaction_type: str
    amount_usd: float
    token: str
    wallet_id: str
    network: str = "base"
    params: dict[str, Any] = Field(default_factory=dict)


# ---------------------------------------------------------------------------
# Mission update (WebSocket)
# ---------------------------------------------------------------------------

class MissionUpdate(BaseModel):
    mission_id: str
    status: MissionStatus
    step: str = ""
    message: str = ""
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    data: dict[str, Any] = Field(default_factory=dict)

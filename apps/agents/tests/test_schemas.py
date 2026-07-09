import pytest
from pydantic import ValidationError

from app.models.schemas import (
    TaskRequest,
    TaskResponse,
    WorkflowState,
    RiskAssessment,
    StrategyConfig,
    StrategyEvaluationRequest,
    PortfolioAnalysisRequest,
    RiskAssessmentRequest,
    MissionUpdate,
    TaskType,
    MissionStatus,
    RiskLevel,
)


class TestTaskType:
    def test_all_8_types(self):
        assert len(TaskType) == 8

    def test_values(self):
        assert TaskType.PAYMENT.value == "payment"
        assert TaskType.EXECUTION.value == "execution"


class TestMissionStatus:
    def test_has_expected_statuses(self):
        assert MissionStatus.PENDING.value == "pending"
        assert MissionStatus.COMPLETED.value == "completed"
        assert MissionStatus.FAILED.value == "failed"


class TestRiskLevel:
    def test_levels(self):
        assert RiskLevel.LOW.value == "low"
        assert RiskLevel.CRITICAL.value == "critical"


class TestTaskRequest:
    def test_minimal_creation(self):
        req = TaskRequest(
            task_type=TaskType.PAYMENT,
            wallet_id="w1",
            user_id="u1",
        )
        assert req.task_type == TaskType.PAYMENT
        assert req.params == {}
        assert req.network == "base"
        assert req.correlation_id  # auto-generated UUID

    def test_full_creation(self):
        req = TaskRequest(
            task_type=TaskType.TRADING,
            params={"token": "ETH", "amount": 1.5},
            wallet_id="w2",
            network="base-sepolia",
            user_id="u2",
            correlation_id="corr-123",
        )
        assert req.params["token"] == "ETH"
        assert req.correlation_id == "corr-123"

    def test_rejects_invalid_task_type(self):
        with pytest.raises(ValidationError):
            TaskRequest(task_type="invalid_type", wallet_id="w1", user_id="u1")


class TestTaskResponse:
    def test_defaults(self):
        resp = TaskResponse()
        assert resp.status == "pending"
        assert resp.message == ""
        assert resp.result is None

    def test_with_result(self):
        resp = TaskResponse(
            mission_id="m1",
            status="completed",
            message="Done",
            result={"tx_hash": "0xabc"},
        )
        assert resp.result["tx_hash"] == "0xabc"


class TestRiskAssessment:
    def test_defaults(self):
        ra = RiskAssessment()
        assert ra.score == 0.0
        assert ra.level == RiskLevel.LOW
        assert ra.approved is True
        assert ra.warnings == []
        assert ra.blockers == []

    def test_high_risk(self):
        ra = RiskAssessment(
            score=85,
            level=RiskLevel.CRITICAL,
            approved=False,
            blockers=["Too risky"],
        )
        assert ra.approved is False
        assert len(ra.blockers) == 1


class TestStrategyConfig:
    def test_minimal(self):
        sc = StrategyConfig(type="dca")
        assert sc.params == {}
        assert sc.schedule == ""


class TestWorkflowState:
    def test_defaults(self):
        ws = WorkflowState()
        assert ws.status == MissionStatus.PENDING
        assert ws.steps == []

    def test_custom(self):
        ws = WorkflowState(current_step="planner", status=MissionStatus.EXECUTING)
        assert ws.current_step == "planner"


class TestStrategyEvaluationRequest:
    def test_creation(self):
        strategy = StrategyConfig(type="dca", params={"amount": 100})
        req = StrategyEvaluationRequest(strategy=strategy, wallet_id="w1")
        assert req.network == "base"


class TestPortfolioAnalysisRequest:
    def test_creation(self):
        req = PortfolioAnalysisRequest(wallet_id="w1", network="base-sepolia")
        assert req.wallet_id == "w1"


class TestRiskAssessmentRequest:
    def test_creation(self):
        req = RiskAssessmentRequest(
            transaction_type="swap",
            amount_usd=500.0,
            token="ETH",
            wallet_id="w1",
        )
        assert req.amount_usd == 500.0


class TestMissionUpdate:
    def test_creation(self):
        mu = MissionUpdate(mission_id="m1", status=MissionStatus.EXECUTING, step="swap")
        assert mu.step == "swap"

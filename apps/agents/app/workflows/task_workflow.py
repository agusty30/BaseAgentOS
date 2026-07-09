from typing import Any
from enum import Enum
import structlog

logger = structlog.get_logger()


class WorkflowStep(str, Enum):
    PLANNER = "planner"
    VALIDATOR = "validator"
    RISK_AGENT = "risk_agent"
    SIMULATION = "simulation"
    USER_APPROVAL = "user_approval"
    EXECUTION = "execution"
    CONFIRMATION = "confirmation"
    ANALYTICS = "analytics"
    MISSION_CONTROL = "mission_control"


class WorkflowState:
    def __init__(self, mission_id: str, task: dict):
        self.mission_id = mission_id
        self.task = task
        self.current_step = WorkflowStep.PLANNER
        self.steps_completed: list[str] = []
        self.context: dict[str, Any] = {}
        self.status = "running"
        self.error: str | None = None

    def advance(self, step: WorkflowStep, result: dict | None = None):
        self.steps_completed.append(step.value)
        if result:
            self.context[step.value] = result
        steps = list(WorkflowStep)
        idx = steps.index(step)
        if idx + 1 < len(steps):
            self.current_step = steps[idx + 1]
        else:
            self.status = "completed"


class TaskWorkflow:
    def __init__(self, api_client=None):
        self.api_client = api_client

    async def execute(self, mission_id: str, task: dict) -> dict:
        state = WorkflowState(mission_id, task)

        try:
            plan = await self._plan(state)
            state.advance(WorkflowStep.PLANNER, plan)

            validation = await self._validate(state)
            state.advance(WorkflowStep.VALIDATOR, validation)

            risk = await self._assess_risk(state)
            state.advance(WorkflowStep.RISK_AGENT, risk)

            if not risk.get("approved", False):
                state.status = "rejected"
                state.error = "Risk assessment rejected the task"
                return self._build_result(state)

            simulation = await self._simulate(state)
            state.advance(WorkflowStep.SIMULATION, simulation)

            if task.get("requires_approval", True):
                approval = await self._request_approval(state)
                state.advance(WorkflowStep.USER_APPROVAL, approval)
                if not approval.get("approved", False):
                    state.status = "rejected"
                    return self._build_result(state)
            else:
                state.advance(WorkflowStep.USER_APPROVAL, {"approved": True, "auto": True})

            execution = await self._execute(state)
            state.advance(WorkflowStep.EXECUTION, execution)

            confirmation = await self._confirm(state)
            state.advance(WorkflowStep.CONFIRMATION, confirmation)

            analytics = await self._record_analytics(state)
            state.advance(WorkflowStep.ANALYTICS, analytics)

            await self._update_mission_control(state)
            state.advance(WorkflowStep.MISSION_CONTROL)

        except Exception as e:
            state.status = "failed"
            state.error = str(e)
            logger.error("workflow_failed", mission_id=mission_id, error=str(e))

        return self._build_result(state)

    async def _plan(self, state: WorkflowState) -> dict:
        logger.info("workflow_step", step="planner", mission_id=state.mission_id)
        task = state.task
        return {
            "task_type": task.get("type"),
            "steps": ["validate", "risk_check", "simulate", "execute", "confirm"],
            "estimated_gas": "0.001 ETH",
        }

    async def _validate(self, state: WorkflowState) -> dict:
        logger.info("workflow_step", step="validator", mission_id=state.mission_id)
        params = state.task.get("params", {})
        errors = []
        if not params:
            errors.append("No parameters provided")
        return {"valid": len(errors) == 0, "errors": errors}

    async def _assess_risk(self, state: WorkflowState) -> dict:
        logger.info("workflow_step", step="risk_agent", mission_id=state.mission_id)
        return {
            "score": 15,
            "level": "low",
            "warnings": [],
            "blockers": [],
            "approved": True,
        }

    async def _simulate(self, state: WorkflowState) -> dict:
        logger.info("workflow_step", step="simulation", mission_id=state.mission_id)
        return {"success": True, "gas_estimate": "0.001 ETH", "output": "Simulation passed"}

    async def _request_approval(self, state: WorkflowState) -> dict:
        logger.info("workflow_step", step="user_approval", mission_id=state.mission_id)
        return {"approved": True, "approver": "auto"}

    async def _execute(self, state: WorkflowState) -> dict:
        logger.info("workflow_step", step="execution", mission_id=state.mission_id)
        return {"tx_hash": None, "status": "simulated"}

    async def _confirm(self, state: WorkflowState) -> dict:
        logger.info("workflow_step", step="confirmation", mission_id=state.mission_id)
        return {"confirmed": True, "block_number": 0}

    async def _record_analytics(self, state: WorkflowState) -> dict:
        logger.info("workflow_step", step="analytics", mission_id=state.mission_id)
        return {"recorded": True}

    async def _update_mission_control(self, state: WorkflowState):
        logger.info("workflow_step", step="mission_control", mission_id=state.mission_id)

    def _build_result(self, state: WorkflowState) -> dict:
        return {
            "mission_id": state.mission_id,
            "status": state.status,
            "steps_completed": state.steps_completed,
            "current_step": state.current_step.value,
            "context": state.context,
            "error": state.error,
        }

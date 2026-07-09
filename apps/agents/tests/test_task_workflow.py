import pytest
from app.workflows.task_workflow import TaskWorkflow, WorkflowState, WorkflowStep


class TestWorkflowState:
    def test_initial_state(self):
        state = WorkflowState("m1", {"type": "payment"})
        assert state.mission_id == "m1"
        assert state.current_step == WorkflowStep.PLANNER
        assert state.steps_completed == []
        assert state.status == "running"
        assert state.error is None

    def test_advance_moves_to_next_step(self):
        state = WorkflowState("m1", {})
        state.advance(WorkflowStep.PLANNER, {"plan": "ok"})
        assert WorkflowStep.PLANNER.value in state.steps_completed
        assert state.current_step == WorkflowStep.VALIDATOR
        assert state.context["planner"] == {"plan": "ok"}

    def test_advance_last_step_marks_completed(self):
        state = WorkflowState("m1", {})
        for step in WorkflowStep:
            state.advance(step)
        assert state.status == "completed"
        assert len(state.steps_completed) == len(WorkflowStep)


class TestWorkflowStepEnum:
    def test_all_9_steps(self):
        assert len(WorkflowStep) == 9

    def test_step_values(self):
        assert WorkflowStep.PLANNER.value == "planner"
        assert WorkflowStep.EXECUTION.value == "execution"
        assert WorkflowStep.MISSION_CONTROL.value == "mission_control"


class TestTaskWorkflow:
    @pytest.mark.asyncio
    async def test_full_workflow_completes(self):
        wf = TaskWorkflow()
        result = await wf.execute("m1", {"type": "payment", "params": {"amount": 100}})
        assert result["status"] == "completed"
        assert result["mission_id"] == "m1"
        assert len(result["steps_completed"]) == 9
        assert result["error"] is None

    @pytest.mark.asyncio
    async def test_workflow_auto_approval(self):
        wf = TaskWorkflow()
        result = await wf.execute("m2", {"type": "swap", "params": {}, "requires_approval": False})
        assert result["status"] == "completed"
        assert result["context"]["user_approval"]["auto"] is True

    @pytest.mark.asyncio
    async def test_workflow_with_empty_params_flags_validation_error(self):
        wf = TaskWorkflow()
        result = await wf.execute("m3", {"type": "test", "params": {}})
        assert result["status"] == "completed"
        assert result["context"]["validator"]["valid"] is False

    @pytest.mark.asyncio
    async def test_workflow_with_populated_params_validates(self):
        wf = TaskWorkflow()
        result = await wf.execute("m3", {"type": "test", "params": {"amount": 100}})
        assert result["status"] == "completed"
        assert result["context"]["validator"]["valid"] is True

    @pytest.mark.asyncio
    async def test_workflow_no_params_validation_error(self):
        wf = TaskWorkflow()
        result = await wf.execute("m4", {"type": "test"})
        assert result["status"] == "completed"
        assert result["context"]["validator"]["errors"] == ["No parameters provided"]

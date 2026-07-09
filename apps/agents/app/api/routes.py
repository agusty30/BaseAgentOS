from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
import structlog

from app.models.schemas import TaskRequest, TaskResponse, RiskAssessmentRequest
from app.agents.manager import AgentManager

router = APIRouter()
logger = structlog.get_logger()
manager = AgentManager()


@router.post("/execute", response_model=TaskResponse)
async def execute_task(request: TaskRequest):
    try:
        result = await manager.route_task(request)
        return result
    except Exception as e:
        logger.error("task_execution_failed", error=str(e), task_type=request.task_type)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status")
async def get_all_agent_status():
    statuses = manager.get_all_status()
    return {"agents": statuses}


@router.get("/{agent_type}/health")
async def get_agent_health(agent_type: str):
    agent = manager.get_agent(agent_type)
    if not agent:
        raise HTTPException(status_code=404, detail=f"Agent '{agent_type}' not found")
    health = await agent.health_check()
    return health


@router.post("/risk/assess")
async def assess_risk(request: RiskAssessmentRequest):
    risk_agent = manager.get_agent("risk")
    if not risk_agent:
        raise HTTPException(status_code=503, detail="Risk agent unavailable")
    result = await risk_agent.execute({
        "type": "assess",
        "params": request.model_dump(),
    })
    return result


@router.post("/portfolio/analyze")
async def analyze_portfolio(user_id: str, network: str = "base-sepolia"):
    portfolio_agent = manager.get_agent("portfolio")
    if not portfolio_agent:
        raise HTTPException(status_code=503, detail="Portfolio agent unavailable")
    result = await portfolio_agent.execute({
        "type": "analyze",
        "params": {"user_id": user_id, "network": network},
    })
    return result


@router.post("/strategies/evaluate")
async def evaluate_strategy(strategy_id: str, strategy_type: str, config: dict):
    from app.strategies.engine import StrategyEngine
    engine = StrategyEngine()
    result = engine.evaluate(strategy_type, config)
    return result


@router.get("/missions/{mission_id}/status")
async def get_mission_status(mission_id: str):
    return {"mission_id": mission_id, "status": "running", "message": "Mission in progress"}


@router.websocket("/ws/missions")
async def mission_websocket(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            statuses = manager.get_all_status()
            await websocket.send_json({"type": "status_update", "data": statuses})
    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected")

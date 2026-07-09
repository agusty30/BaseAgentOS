import asyncio
from datetime import datetime, timezone
from typing import Optional
import structlog

from app.agents.base import BaseAgent
from app.agents.payment_agent import PaymentAgent
from app.agents.treasury_agent import TreasuryAgent
from app.agents.trading_agent import TradingAgent
from app.agents.portfolio_agent import PortfolioAgent
from app.agents.risk_agent import RiskAgent
from app.agents.notification_agent import NotificationAgent
from app.agents.analytics_agent import AnalyticsAgent
from app.agents.execution_agent import ExecutionAgent
from app.models.schemas import TaskRequest, TaskResponse
from app.memory.store import AgentMemory

logger = structlog.get_logger()


class AgentManager:
    _instance: Optional["AgentManager"] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    async def initialize(self):
        if self._initialized:
            return

        self.memory = AgentMemory()
        self.agents: dict[str, BaseAgent] = {}
        self._health_task: Optional[asyncio.Task] = None

        agent_classes = [
            PaymentAgent,
            TreasuryAgent,
            TradingAgent,
            PortfolioAgent,
            RiskAgent,
            NotificationAgent,
            AnalyticsAgent,
            ExecutionAgent,
        ]

        for cls in agent_classes:
            agent = cls()
            self.agents[agent.agent_type] = agent
            logger.info("agent_registered", agent_type=agent.agent_type, name=agent.name)

        self._health_task = asyncio.create_task(self._health_monitor_loop())
        self._initialized = True
        logger.info("agent_manager_initialized", agent_count=len(self.agents))

    async def shutdown(self):
        if self._health_task:
            self._health_task.cancel()
            try:
                await self._health_task
            except asyncio.CancelledError:
                pass
        logger.info("agent_manager_shutdown")

    def get_agent(self, agent_type: str) -> Optional[BaseAgent]:
        return self.agents.get(agent_type)

    async def route_task(self, request: TaskRequest) -> TaskResponse:
        agent_type = self._determine_agent(request.task_type)
        agent = self.agents.get(agent_type)

        if not agent:
            raise ValueError(f"No agent found for task type: {request.task_type}")

        logger.info(
            "routing_task",
            task_type=request.task_type,
            agent_type=agent_type,
            correlation_id=request.correlation_id,
        )

        max_retries = 3
        for attempt in range(max_retries):
            try:
                result = await agent.execute({
                    "type": request.task_type,
                    "params": request.params,
                    "wallet_id": request.wallet_id,
                    "network": request.network,
                    "user_id": request.user_id,
                    "correlation_id": request.correlation_id,
                })
                return TaskResponse(
                    mission_id=request.correlation_id,
                    status="completed",
                    message=f"Task completed by {agent.name}",
                    result=result,
                )
            except Exception as e:
                logger.warning(
                    "task_attempt_failed",
                    attempt=attempt + 1,
                    agent_type=agent_type,
                    error=str(e),
                )
                if attempt < max_retries - 1:
                    await asyncio.sleep(2 ** attempt)
                else:
                    return TaskResponse(
                        mission_id=request.correlation_id,
                        status="failed",
                        message=f"Task failed after {max_retries} attempts: {str(e)}",
                    )

        return TaskResponse(
            mission_id=request.correlation_id,
            status="failed",
            message="Unexpected error in task routing",
        )

    def _determine_agent(self, task_type: str) -> str:
        routing_map = {
            "payment": "payment",
            "transfer": "payment",
            "batch_payment": "payment",
            "scheduled_payment": "payment",
            "treasury_optimize": "treasury",
            "treasury_allocate": "treasury",
            "swap": "trading",
            "quote": "trading",
            "trade": "trading",
            "portfolio_analyze": "portfolio",
            "portfolio_snapshot": "portfolio",
            "risk_assess": "risk",
            "risk_check": "risk",
            "notify": "notification",
            "alert": "notification",
            "analytics_report": "analytics",
            "metrics": "analytics",
            "execute_tx": "execution",
            "submit_tx": "execution",
        }
        return routing_map.get(task_type, "execution")

    def get_all_status(self) -> list[dict]:
        statuses = []
        for agent_type, agent in self.agents.items():
            statuses.append({
                "agent_type": agent_type,
                "name": agent.name,
                "status": "healthy",
                "tasks_completed": getattr(agent, "tasks_completed", 0),
                "error_count": getattr(agent, "error_count", 0),
                "last_heartbeat": datetime.now(timezone.utc).isoformat(),
            })
        return statuses

    async def _health_monitor_loop(self):
        while True:
            try:
                for agent_type, agent in self.agents.items():
                    try:
                        await agent.health_check()
                    except Exception as e:
                        logger.warning("agent_health_check_failed", agent_type=agent_type, error=str(e))
                await asyncio.sleep(30)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error("health_monitor_error", error=str(e))
                await asyncio.sleep(60)

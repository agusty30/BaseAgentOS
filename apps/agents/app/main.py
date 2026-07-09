from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import structlog

from app.config import settings
from app.api.routes import router
from app.agents.manager import AgentManager

logger = structlog.get_logger()
agent_manager = AgentManager()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting BaseAgent OS Agent Service")
    await agent_manager.initialize()
    yield
    logger.info("Shutting down Agent Service")
    await agent_manager.shutdown()


app = FastAPI(
    title="BaseAgent OS - Agent Service",
    description="AI Agent orchestration service for autonomous on-chain finance",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.cors_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/agents")


@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "agent-service",
        "version": "0.1.0",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

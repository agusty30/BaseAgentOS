from __future__ import annotations

import asyncio
from typing import Any

import structlog

from app.agents.base import AgentError, BaseAgent

logger = structlog.get_logger(__name__)

# How often to poll for confirmation (seconds)
_POLL_INTERVAL = 2.0
_MAX_POLL_ATTEMPTS = 150  # 5 minutes at 2s intervals


class ExecutionAgent(BaseAgent):
    """Interface to blockchain via the upstream API. Submits transactions, monitors confirmations."""

    name = "Execution Agent"
    description = "Submits transactions to the blockchain via the API, monitors confirmation, and reports results."
    agent_type = "execution"

    # ------------------------------------------------------------------
    # Execute
    # ------------------------------------------------------------------

    async def execute(self, task: dict[str, Any]) -> dict[str, Any]:
        mission_id = task.get("mission_id", "unknown")
        params = task.get("params", {})
        wallet_id = task.get("wallet_id", "")
        network = task.get("network", "base")

        self._mark_busy()

        try:
            action = params.get("action", "submit")

            if action == "submit":
                return await self._submit_and_confirm(mission_id, params, wallet_id, network)
            elif action == "status":
                return await self._check_status(mission_id, params)
            else:
                self._record_success()
                return {"status": "completed", "message": f"Unknown execution action '{action}'"}

        except Exception as exc:
            self._record_failure()
            await self.log_step(mission_id, "execution", "failed", {"error": str(exc)})
            raise

    # ------------------------------------------------------------------
    # Submit + confirm
    # ------------------------------------------------------------------

    async def _submit_and_confirm(
        self,
        mission_id: str,
        params: dict[str, Any],
        wallet_id: str,
        network: str,
    ) -> dict[str, Any]:
        # Step 1: Submit the transaction
        await self.log_step(mission_id, "submit_transaction", "started", {"params": params})

        tx_payload = {
            "wallet_id": wallet_id,
            "network": network,
            "transaction_type": params.get("transaction_type", ""),
            "data": params.get("tx_data", {}),
        }

        submit_result = await self.call_api("POST", "/api/transactions/submit", tx_payload)
        tx_id = submit_result.get("transaction_id", "")

        if not tx_id:
            raise AgentError(
                "API did not return a transaction_id after submission",
                agent_type=self.agent_type,
            )

        await self.log_step(mission_id, "submit_transaction", "completed", {
            "transaction_id": tx_id,
            "tx_hash": submit_result.get("tx_hash", ""),
        })

        # Step 2: Monitor confirmation
        await self.log_step(mission_id, "monitor_confirmation", "started", {"transaction_id": tx_id})

        confirmed_result = await self._poll_confirmation(tx_id, network)

        status = confirmed_result.get("status", "unknown")
        if status == "confirmed":
            await self.log_step(mission_id, "monitor_confirmation", "completed", confirmed_result)
        else:
            await self.log_step(mission_id, "monitor_confirmation", "failed", confirmed_result)
            raise AgentError(
                f"Transaction {tx_id} ended with status: {status}",
                agent_type=self.agent_type,
                details=confirmed_result,
            )

        # Step 3: Report results
        await self.log_step(mission_id, "report_results", "completed", {
            "transaction_id": tx_id,
            "block_number": confirmed_result.get("block_number"),
            "gas_used": confirmed_result.get("gas_used"),
        })

        self._record_success()
        return {
            "status": "completed",
            "transaction_id": tx_id,
            "tx_hash": submit_result.get("tx_hash", ""),
            "confirmation": confirmed_result,
        }

    # ------------------------------------------------------------------
    # Poll confirmation
    # ------------------------------------------------------------------

    async def _poll_confirmation(self, tx_id: str, network: str) -> dict[str, Any]:
        for attempt in range(_MAX_POLL_ATTEMPTS):
            try:
                result = await self.call_api(
                    "GET",
                    f"/api/transactions/{tx_id}/status?network={network}",
                )
                tx_status = result.get("status", "pending")

                if tx_status == "confirmed":
                    return result
                if tx_status in ("failed", "reverted", "dropped"):
                    return result

            except Exception as exc:
                await logger.awarning(
                    "execution.poll_error",
                    tx_id=tx_id,
                    attempt=attempt,
                    error=str(exc),
                )

            await asyncio.sleep(_POLL_INTERVAL)

        return {"status": "timeout", "transaction_id": tx_id, "message": "Confirmation timed out"}

    # ------------------------------------------------------------------
    # Status check
    # ------------------------------------------------------------------

    async def _check_status(self, mission_id: str, params: dict[str, Any]) -> dict[str, Any]:
        tx_id = params.get("transaction_id", "")
        network = params.get("network", "base")

        if not tx_id:
            raise AgentError("transaction_id is required for status check", agent_type=self.agent_type)

        await self.log_step(mission_id, "check_status", "started", {"transaction_id": tx_id})

        result = await self.call_api(
            "GET",
            f"/api/transactions/{tx_id}/status?network={network}",
        )

        await self.log_step(mission_id, "check_status", "completed", result)
        self._record_success()
        return {"status": "completed", "transaction": result}

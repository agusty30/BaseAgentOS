from __future__ import annotations

import re
from typing import Any

import structlog

from app.agents.base import AgentValidationError, BaseAgent

logger = structlog.get_logger(__name__)


class PaymentAgent(BaseAgent):
    """Plans and executes USDC transfers via the upstream API."""

    name = "Payment Agent"
    description = "Plans USDC transfers, validates recipients, estimates gas, and executes through the API."
    agent_type = "payment"

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _is_valid_address(address: str) -> bool:
        return bool(re.match(r"^0x[0-9a-fA-F]{40}$", address))

    async def _estimate_gas(self, network: str, token: str, amount: float) -> dict[str, Any]:
        """Estimate gas for a transfer via the API."""
        try:
            result = await self.call_api(
                "POST",
                "/api/transactions/estimate-gas",
                {"network": network, "token": token, "amount": amount},
            )
            return result
        except Exception:
            # Fallback estimate when API is unreachable
            return {
                "gas_estimate": 21000,
                "gas_price_gwei": 0.1,
                "estimated_fee_usd": 0.01,
            }

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
            # Step 1: Plan the transfer
            await self.log_step(mission_id, "plan_transfer", "started", {"params": params})

            recipient = params.get("recipient", "")
            amount = float(params.get("amount", 0))
            token = params.get("token", "USDC")

            if not recipient or amount <= 0:
                raise AgentValidationError(
                    "Missing or invalid recipient / amount",
                    agent_type=self.agent_type,
                )

            plan = {
                "from_wallet": wallet_id,
                "to_address": recipient,
                "amount": amount,
                "token": token,
                "network": network,
            }
            await self.log_step(mission_id, "plan_transfer", "completed", {"plan": plan})

            # Step 2: Validate recipient address
            await self.log_step(mission_id, "validate_recipient", "started")
            if not self._is_valid_address(recipient):
                raise AgentValidationError(
                    f"Invalid recipient address: {recipient}",
                    agent_type=self.agent_type,
                )
            await self.log_step(mission_id, "validate_recipient", "completed")

            # Step 3: Estimate gas
            await self.log_step(mission_id, "estimate_gas", "started")
            gas = await self._estimate_gas(network, token, amount)
            await self.log_step(mission_id, "estimate_gas", "completed", {"gas": gas})

            # Step 4: Execute transfer via API
            await self.log_step(mission_id, "execute_transfer", "started")
            tx_result = await self.call_api(
                "POST",
                "/api/transactions/transfer",
                {
                    "wallet_id": wallet_id,
                    "recipient": recipient,
                    "amount": amount,
                    "token": token,
                    "network": network,
                },
            )
            await self.log_step(mission_id, "execute_transfer", "completed", {"tx": tx_result})

            self._record_success()
            return {
                "status": "completed",
                "plan": plan,
                "gas_estimate": gas,
                "transaction": tx_result,
            }

        except AgentValidationError:
            self._record_failure()
            raise
        except Exception as exc:
            self._record_failure()
            await self.log_step(mission_id, "payment", "failed", {"error": str(exc)})
            raise

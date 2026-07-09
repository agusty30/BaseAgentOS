from typing import Any
import structlog

logger = structlog.get_logger()


class StrategyEngine:
    def evaluate(self, strategy_type: str, config: dict) -> dict:
        evaluators = {
            "dca": self._evaluate_dca,
            "recurring-buy": self._evaluate_recurring,
            "recurring-sell": self._evaluate_recurring,
            "rebalance": self._evaluate_rebalance,
            "profit-target": self._evaluate_profit_target,
            "stop-loss": self._evaluate_stop_loss,
        }

        evaluator = evaluators.get(strategy_type)
        if not evaluator:
            return {"error": f"Unknown strategy type: {strategy_type}", "should_execute": False}

        return evaluator(config)

    def _evaluate_dca(self, config: dict) -> dict:
        amount_per_buy = float(config.get("amount_per_buy", 0))
        token = config.get("token", "ETH")
        frequency = config.get("frequency", "daily")

        if amount_per_buy <= 0:
            return {"should_execute": False, "reason": "Invalid amount"}

        max_daily = float(config.get("max_daily_spend", 10000))
        if amount_per_buy > max_daily:
            return {"should_execute": False, "reason": f"Amount ${amount_per_buy} exceeds daily limit ${max_daily}"}

        return {
            "should_execute": True,
            "action": "buy",
            "token": token,
            "amount": amount_per_buy,
            "frequency": frequency,
        }

    def _evaluate_recurring(self, config: dict) -> dict:
        amount = float(config.get("amount", 0))
        token = config.get("token", "ETH")
        side = config.get("side", "buy")

        if amount <= 0:
            return {"should_execute": False, "reason": "Invalid amount"}

        return {
            "should_execute": True,
            "action": side,
            "token": token,
            "amount": amount,
        }

    def _evaluate_rebalance(self, config: dict) -> dict:
        target_allocations = config.get("target_allocations", {})
        current_allocations = config.get("current_allocations", {})
        threshold = float(config.get("threshold", 5.0))

        trades: list[dict] = []

        for token, target in target_allocations.items():
            current = current_allocations.get(token, 0)
            diff = float(current) - float(target)

            if abs(diff) > threshold:
                trades.append({
                    "token": token,
                    "action": "sell" if diff > 0 else "buy",
                    "percentage_diff": abs(diff),
                })

        return {
            "should_execute": len(trades) > 0,
            "trades": trades,
            "threshold": threshold,
        }

    def _evaluate_profit_target(self, config: dict) -> dict:
        target_price = float(config.get("target_price", 0))
        current_price = float(config.get("current_price", 0))
        token = config.get("token", "ETH")
        sell_percentage = float(config.get("sell_percentage", 100))

        if current_price <= 0 or target_price <= 0:
            return {"should_execute": False, "reason": "Invalid price data"}

        hit = current_price >= target_price

        return {
            "should_execute": hit,
            "token": token,
            "action": "sell",
            "sell_percentage": sell_percentage,
            "current_price": current_price,
            "target_price": target_price,
            "reason": "Target price reached" if hit else f"Current ${current_price} below target ${target_price}",
        }

    def _evaluate_stop_loss(self, config: dict) -> dict:
        stop_price = float(config.get("stop_price", 0))
        current_price = float(config.get("current_price", 0))
        token = config.get("token", "ETH")
        sell_percentage = float(config.get("sell_percentage", 100))

        if current_price <= 0 or stop_price <= 0:
            return {"should_execute": False, "reason": "Invalid price data"}

        triggered = current_price <= stop_price

        return {
            "should_execute": triggered,
            "token": token,
            "action": "sell",
            "sell_percentage": sell_percentage,
            "current_price": current_price,
            "stop_price": stop_price,
            "reason": "Stop loss triggered" if triggered else f"Current ${current_price} above stop ${stop_price}",
        }

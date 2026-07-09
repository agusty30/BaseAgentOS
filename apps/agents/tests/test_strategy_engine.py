import pytest
from app.strategies.engine import StrategyEngine


@pytest.fixture
def engine():
    return StrategyEngine()


class TestDCA:
    def test_valid_dca(self, engine):
        result = engine.evaluate("dca", {"amount_per_buy": 100, "token": "ETH", "frequency": "weekly"})
        assert result["should_execute"] is True
        assert result["amount"] == 100
        assert result["token"] == "ETH"
        assert result["action"] == "buy"

    def test_zero_amount(self, engine):
        result = engine.evaluate("dca", {"amount_per_buy": 0})
        assert result["should_execute"] is False

    def test_negative_amount(self, engine):
        result = engine.evaluate("dca", {"amount_per_buy": -10})
        assert result["should_execute"] is False

    def test_exceeds_daily_limit(self, engine):
        result = engine.evaluate("dca", {"amount_per_buy": 20000, "max_daily_spend": 10000})
        assert result["should_execute"] is False
        assert "exceeds" in result["reason"]


class TestRecurring:
    def test_recurring_buy(self, engine):
        result = engine.evaluate("recurring-buy", {"amount": 50, "token": "USDC", "side": "buy"})
        assert result["should_execute"] is True
        assert result["action"] == "buy"

    def test_recurring_sell(self, engine):
        result = engine.evaluate("recurring-sell", {"amount": 25, "side": "sell"})
        assert result["should_execute"] is True
        assert result["action"] == "sell"

    def test_zero_amount(self, engine):
        result = engine.evaluate("recurring-buy", {"amount": 0})
        assert result["should_execute"] is False


class TestRebalance:
    def test_needs_rebalance(self, engine):
        config = {
            "target_allocations": {"ETH": 50, "USDC": 50},
            "current_allocations": {"ETH": 65, "USDC": 35},
            "threshold": 5,
        }
        result = engine.evaluate("rebalance", config)
        assert result["should_execute"] is True
        assert len(result["trades"]) == 2
        eth_trade = next(t for t in result["trades"] if t["token"] == "ETH")
        assert eth_trade["action"] == "sell"

    def test_within_threshold(self, engine):
        config = {
            "target_allocations": {"ETH": 50},
            "current_allocations": {"ETH": 52},
            "threshold": 5,
        }
        result = engine.evaluate("rebalance", config)
        assert result["should_execute"] is False

    def test_missing_current_allocation(self, engine):
        config = {
            "target_allocations": {"NEW": 20},
            "current_allocations": {},
            "threshold": 5,
        }
        result = engine.evaluate("rebalance", config)
        assert result["should_execute"] is True
        assert result["trades"][0]["action"] == "buy"


class TestProfitTarget:
    def test_target_reached(self, engine):
        result = engine.evaluate("profit-target", {
            "target_price": 2000,
            "current_price": 2500,
            "token": "ETH",
            "sell_percentage": 50,
        })
        assert result["should_execute"] is True
        assert result["action"] == "sell"
        assert result["sell_percentage"] == 50

    def test_below_target(self, engine):
        result = engine.evaluate("profit-target", {
            "target_price": 3000,
            "current_price": 2500,
        })
        assert result["should_execute"] is False

    def test_invalid_prices(self, engine):
        result = engine.evaluate("profit-target", {"target_price": 0, "current_price": 0})
        assert result["should_execute"] is False


class TestStopLoss:
    def test_stop_loss_triggered(self, engine):
        result = engine.evaluate("stop-loss", {
            "stop_price": 1500,
            "current_price": 1200,
            "token": "ETH",
        })
        assert result["should_execute"] is True
        assert result["action"] == "sell"

    def test_above_stop(self, engine):
        result = engine.evaluate("stop-loss", {
            "stop_price": 1500,
            "current_price": 2000,
        })
        assert result["should_execute"] is False

    def test_exactly_at_stop(self, engine):
        result = engine.evaluate("stop-loss", {
            "stop_price": 1500,
            "current_price": 1500,
        })
        assert result["should_execute"] is True


class TestUnknownStrategy:
    def test_unknown_type(self, engine):
        result = engine.evaluate("arbitrage", {})
        assert result["should_execute"] is False
        assert "Unknown" in result["error"]

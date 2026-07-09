from unittest.mock import MagicMock
from app.agents.manager import AgentManager


class TestDetermineAgent:
    def setup_method(self):
        AgentManager._instance = None
        self.manager = AgentManager.__new__(AgentManager)
        self.manager._initialized = False

    def test_payment_routing(self):
        assert self.manager._determine_agent("payment") == "payment"
        assert self.manager._determine_agent("transfer") == "payment"
        assert self.manager._determine_agent("batch_payment") == "payment"
        assert self.manager._determine_agent("scheduled_payment") == "payment"

    def test_treasury_routing(self):
        assert self.manager._determine_agent("treasury_optimize") == "treasury"
        assert self.manager._determine_agent("treasury_allocate") == "treasury"

    def test_trading_routing(self):
        assert self.manager._determine_agent("swap") == "trading"
        assert self.manager._determine_agent("quote") == "trading"
        assert self.manager._determine_agent("trade") == "trading"

    def test_portfolio_routing(self):
        assert self.manager._determine_agent("portfolio_analyze") == "portfolio"
        assert self.manager._determine_agent("portfolio_snapshot") == "portfolio"

    def test_risk_routing(self):
        assert self.manager._determine_agent("risk_assess") == "risk"
        assert self.manager._determine_agent("risk_check") == "risk"

    def test_notification_routing(self):
        assert self.manager._determine_agent("notify") == "notification"
        assert self.manager._determine_agent("alert") == "notification"

    def test_analytics_routing(self):
        assert self.manager._determine_agent("analytics_report") == "analytics"
        assert self.manager._determine_agent("metrics") == "analytics"

    def test_execution_routing(self):
        assert self.manager._determine_agent("execute_tx") == "execution"
        assert self.manager._determine_agent("submit_tx") == "execution"

    def test_unknown_defaults_to_execution(self):
        assert self.manager._determine_agent("unknown_task") == "execution"
        assert self.manager._determine_agent("") == "execution"

    def teardown_method(self):
        AgentManager._instance = None


class TestGetAllStatus:
    def setup_method(self):
        AgentManager._instance = None
        self.manager = AgentManager.__new__(AgentManager)
        self.manager._initialized = False

    def test_returns_status_for_all_agents(self):
        mock_agent = MagicMock()
        mock_agent.name = "Test Agent"
        mock_agent.tasks_completed = 5
        mock_agent.error_count = 1

        self.manager.agents = {"test": mock_agent, "test2": mock_agent}
        statuses = self.manager.get_all_status()
        assert len(statuses) == 2
        assert statuses[0]["status"] == "healthy"
        assert statuses[0]["tasks_completed"] == 5

    def teardown_method(self):
        AgentManager._instance = None


class TestSingleton:
    def setup_method(self):
        AgentManager._instance = None

    def test_singleton_pattern(self):
        a = AgentManager()
        b = AgentManager()
        assert a is b

    def teardown_method(self):
        AgentManager._instance = None

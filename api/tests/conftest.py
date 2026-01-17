"""
Test configuration and fixtures for White Rabbit API tests.
"""
import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import AsyncMock, MagicMock, patch


@pytest.fixture
def mock_db_driver():
    """Mock Neo4j driver for testing without database connection."""
    driver = MagicMock()
    driver.verify_connectivity = AsyncMock()
    return driver


@pytest.fixture
def mock_search_results():
    """Sample search results for testing."""
    return [
        {"id": "mystery-1", "type": "Mystery", "text": "Bermuda Triangle", "score": 2.5},
        {"id": "location-1", "type": "Location", "text": "Bermuda", "score": 1.8},
        {"id": "category-1", "type": "Category", "text": "Mysterious Disappearances", "score": 1.2},
    ]


@pytest.fixture
def mock_empty_results():
    """Empty search results for testing no-match scenarios."""
    return []


@pytest.fixture
async def test_client(mock_db_driver):
    """
    Create a test client with mocked database connection.
    """
    with patch("src.db.neo4j.get_driver") as mock_get_driver:
        mock_get_driver.return_value = mock_db_driver

        # Import app after patching to use mocked driver
        from src.main import app

        # Mock the lifespan to skip actual DB connection
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test"
        ) as client:
            # Attach mock driver to app state
            app.state.driver = mock_db_driver
            yield client

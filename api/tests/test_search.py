"""
Integration tests for the Search API endpoint.

Tests cover:
- Successful search with results
- Empty search results
- Query parameter validation
- Edge cases (special characters, boundary values)
"""
import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import AsyncMock, patch


class TestSearchEndpoint:
    """Tests for GET /api/search endpoint."""

    @pytest.mark.asyncio
    async def test_search_with_valid_query(self, mock_search_results):
        """Test successful search returns expected results."""
        with patch("src.db.neo4j.execute_read_query") as mock_execute:
            mock_execute.return_value = mock_search_results

            with patch("src.db.neo4j.get_driver"):
                from src.main import app

                async with AsyncClient(
                    transport=ASGITransport(app=app),
                    base_url="http://test"
                ) as client:
                    response = await client.get("/api/search", params={"q": "bermuda"})

                    assert response.status_code == 200
                    data = response.json()
                    assert data["query"] == "bermuda"
                    assert data["total"] == 3
                    assert len(data["results"]) == 3
                    assert data["results"][0]["type"] == "Mystery"
                    assert data["results"][0]["text"] == "Bermuda Triangle"

    @pytest.mark.asyncio
    async def test_search_with_limit_parameter(self, mock_search_results):
        """Test search respects limit parameter."""
        with patch("src.db.neo4j.execute_read_query") as mock_execute:
            # Return only first result when limit=1
            mock_execute.return_value = mock_search_results[:1]

            with patch("src.db.neo4j.get_driver"):
                from src.main import app

                async with AsyncClient(
                    transport=ASGITransport(app=app),
                    base_url="http://test"
                ) as client:
                    response = await client.get("/api/search", params={"q": "bermuda", "limit": 1})

                    assert response.status_code == 200
                    data = response.json()
                    assert data["total"] == 1

    @pytest.mark.asyncio
    async def test_search_empty_results(self, mock_empty_results):
        """Test search with no matching results."""
        with patch("src.db.neo4j.execute_read_query") as mock_execute:
            mock_execute.return_value = mock_empty_results

            with patch("src.db.neo4j.get_driver"):
                from src.main import app

                async with AsyncClient(
                    transport=ASGITransport(app=app),
                    base_url="http://test"
                ) as client:
                    response = await client.get("/api/search", params={"q": "nonexistent"})

                    assert response.status_code == 200
                    data = response.json()
                    assert data["query"] == "nonexistent"
                    assert data["total"] == 0
                    assert data["results"] == []

    @pytest.mark.asyncio
    async def test_search_missing_query_parameter(self):
        """Test search without required query parameter returns 422."""
        with patch("src.db.neo4j.get_driver"):
            from src.main import app

            async with AsyncClient(
                transport=ASGITransport(app=app),
                base_url="http://test"
            ) as client:
                response = await client.get("/api/search")

                assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_search_empty_query_string(self):
        """Test search with empty query string returns 422."""
        with patch("src.db.neo4j.get_driver"):
            from src.main import app

            async with AsyncClient(
                transport=ASGITransport(app=app),
                base_url="http://test"
            ) as client:
                response = await client.get("/api/search", params={"q": ""})

                assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_search_query_too_long(self):
        """Test search with query exceeding max length returns 422."""
        with patch("src.db.neo4j.get_driver"):
            from src.main import app

            async with AsyncClient(
                transport=ASGITransport(app=app),
                base_url="http://test"
            ) as client:
                long_query = "a" * 201  # Max is 200
                response = await client.get("/api/search", params={"q": long_query})

                assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_search_limit_below_minimum(self):
        """Test search with limit below minimum returns 422."""
        with patch("src.db.neo4j.get_driver"):
            from src.main import app

            async with AsyncClient(
                transport=ASGITransport(app=app),
                base_url="http://test"
            ) as client:
                response = await client.get("/api/search", params={"q": "test", "limit": 0})

                assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_search_limit_above_maximum(self):
        """Test search with limit above maximum returns 422."""
        with patch("src.db.neo4j.get_driver"):
            from src.main import app

            async with AsyncClient(
                transport=ASGITransport(app=app),
                base_url="http://test"
            ) as client:
                response = await client.get("/api/search", params={"q": "test", "limit": 101})

                assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_search_with_special_characters(self, mock_search_results):
        """Test search handles special characters safely."""
        with patch("src.db.neo4j.execute_read_query") as mock_execute:
            mock_execute.return_value = mock_search_results

            with patch("src.db.neo4j.get_driver"):
                from src.main import app

                async with AsyncClient(
                    transport=ASGITransport(app=app),
                    base_url="http://test"
                ) as client:
                    # Test with various special characters
                    response = await client.get("/api/search", params={"q": "test's \"query\""})

                    assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_search_with_unicode_characters(self, mock_search_results):
        """Test search handles unicode characters."""
        with patch("src.db.neo4j.execute_read_query") as mock_execute:
            mock_execute.return_value = mock_search_results

            with patch("src.db.neo4j.get_driver"):
                from src.main import app

                async with AsyncClient(
                    transport=ASGITransport(app=app),
                    base_url="http://test"
                ) as client:
                    response = await client.get("/api/search", params={"q": "mystere"})

                    assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_search_result_structure(self, mock_search_results):
        """Test search result items have correct structure."""
        with patch("src.db.neo4j.execute_read_query") as mock_execute:
            mock_execute.return_value = mock_search_results

            with patch("src.db.neo4j.get_driver"):
                from src.main import app

                async with AsyncClient(
                    transport=ASGITransport(app=app),
                    base_url="http://test"
                ) as client:
                    response = await client.get("/api/search", params={"q": "bermuda"})

                    assert response.status_code == 200
                    data = response.json()

                    # Verify response structure
                    assert "query" in data
                    assert "total" in data
                    assert "results" in data

                    # Verify result item structure
                    for result in data["results"]:
                        assert "id" in result
                        assert "type" in result
                        assert "text" in result
                        assert "score" in result
                        assert isinstance(result["score"], float)

    @pytest.mark.asyncio
    async def test_search_results_sorted_by_score(self, mock_search_results):
        """Test search results are sorted by score descending."""
        with patch("src.db.neo4j.execute_read_query") as mock_execute:
            mock_execute.return_value = mock_search_results

            with patch("src.db.neo4j.get_driver"):
                from src.main import app

                async with AsyncClient(
                    transport=ASGITransport(app=app),
                    base_url="http://test"
                ) as client:
                    response = await client.get("/api/search", params={"q": "bermuda"})

                    assert response.status_code == 200
                    data = response.json()

                    scores = [r["score"] for r in data["results"]]
                    assert scores == sorted(scores, reverse=True)


class TestSearchParameterValidation:
    """Tests for search query parameter edge cases."""

    @pytest.mark.asyncio
    async def test_search_minimum_query_length(self, mock_search_results):
        """Test search with minimum valid query length (1 character)."""
        with patch("src.db.neo4j.execute_read_query") as mock_execute:
            mock_execute.return_value = mock_search_results

            with patch("src.db.neo4j.get_driver"):
                from src.main import app

                async with AsyncClient(
                    transport=ASGITransport(app=app),
                    base_url="http://test"
                ) as client:
                    response = await client.get("/api/search", params={"q": "a"})

                    assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_search_maximum_query_length(self, mock_search_results):
        """Test search with maximum valid query length (200 characters)."""
        with patch("src.db.neo4j.execute_read_query") as mock_execute:
            mock_execute.return_value = mock_search_results

            with patch("src.db.neo4j.get_driver"):
                from src.main import app

                async with AsyncClient(
                    transport=ASGITransport(app=app),
                    base_url="http://test"
                ) as client:
                    long_query = "a" * 200
                    response = await client.get("/api/search", params={"q": long_query})

                    assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_search_minimum_limit(self, mock_search_results):
        """Test search with minimum valid limit (1)."""
        with patch("src.db.neo4j.execute_read_query") as mock_execute:
            mock_execute.return_value = mock_search_results[:1]

            with patch("src.db.neo4j.get_driver"):
                from src.main import app

                async with AsyncClient(
                    transport=ASGITransport(app=app),
                    base_url="http://test"
                ) as client:
                    response = await client.get("/api/search", params={"q": "test", "limit": 1})

                    assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_search_maximum_limit(self, mock_search_results):
        """Test search with maximum valid limit (100)."""
        with patch("src.db.neo4j.execute_read_query") as mock_execute:
            mock_execute.return_value = mock_search_results

            with patch("src.db.neo4j.get_driver"):
                from src.main import app

                async with AsyncClient(
                    transport=ASGITransport(app=app),
                    base_url="http://test"
                ) as client:
                    response = await client.get("/api/search", params={"q": "test", "limit": 100})

                    assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_search_default_limit(self, mock_search_results):
        """Test search uses default limit when not specified."""
        with patch("src.db.neo4j.execute_read_query") as mock_execute:
            mock_execute.return_value = mock_search_results

            with patch("src.db.neo4j.get_driver"):
                from src.main import app

                async with AsyncClient(
                    transport=ASGITransport(app=app),
                    base_url="http://test"
                ) as client:
                    response = await client.get("/api/search", params={"q": "test"})

                    assert response.status_code == 200
                    # Verify the mock was called with default limit of 10
                    call_args = mock_execute.call_args
                    assert call_args[1]["parameters"]["limit"] == 10
